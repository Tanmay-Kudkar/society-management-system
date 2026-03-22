package com.society.backend.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import com.society.backend.flat.entity.Tenant;
import com.society.backend.security.entity.Visitor;
import com.society.backend.user.entity.Role;
import com.society.backend.vendor.entity.Vendor;
@Slf4j
@Configuration
@RequiredArgsConstructor
public class SchemaMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    public ApplicationRunner ensureSocietyHasWingsColumn() {
        return args -> {
            try {
                jdbcTemplate.execute(
                        "ALTER TABLE societies ADD COLUMN IF NOT EXISTS has_wings BOOLEAN DEFAULT TRUE");
                jdbcTemplate.execute(
                        "UPDATE societies SET has_wings = CASE WHEN total_wings > 0 THEN TRUE ELSE FALSE END WHERE has_wings IS NULL");
                jdbcTemplate.execute("ALTER TABLE societies ALTER COLUMN has_wings SET DEFAULT TRUE");
                log.info("societies.has_wings column verified/updated");
            } catch (Exception ex) {
                log.warn("Failed to add/update societies.has_wings column: {}", ex.getMessage());
            }
        };
    }

    @Bean
    public ApplicationRunner repairUserRoleConstraint() {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
                // Migrate legacy roles to new 12-role system
                jdbcTemplate.execute("UPDATE users SET role = 'MASTER_ADMIN' WHERE role = 'PLATFORM_OWNER'");
                jdbcTemplate.execute("UPDATE users SET role = 'SOCIETY_ADMIN' WHERE role = 'ORGANIZATION_OWNER'");
                jdbcTemplate.execute(
                    "UPDATE users SET role = 'VISITOR' " +
                    "WHERE role IS NULL OR role NOT IN ('MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER','EMPLOYEE','MEMBER','TENANT','VENDOR','VISITOR')"
                );
                jdbcTemplate.execute("UPDATE users SET account_type = NULL WHERE account_type IS NOT NULL AND account_type NOT IN ('SOCIETY_ADMIN')");
                jdbcTemplate.execute(
                        "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                    "CHECK (role IN ('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VENDOR', 'VISITOR'))"
                );
                log.info("users_role_check constraint verified/updated (12-role system)");
            } catch (Exception ex) {
                log.warn("Failed to update users_role_check constraint: {}", ex.getMessage());
            }
        };
    }

    @Bean
    public ApplicationRunner repairComplaintUndoColumns() {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status_undo_previous_status VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status_undo_previous_resolution TEXT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status_undo_expires_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS wing VARCHAR(20)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS floor INTEGER");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS flat_number VARCHAR(20)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location_details VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS raised_for_user_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS raised_for_reason TEXT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS admin_remarks TEXT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_previous_status VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_previous_resolution TEXT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_expires_at TIMESTAMP");

                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN");
                jdbcTemplate.execute("UPDATE complaints SET is_deleted = FALSE WHERE is_deleted IS NULL");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN is_deleted SET DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN is_deleted SET NOT NULL");

                jdbcTemplate.execute("UPDATE complaints SET priority = 'MEDIUM' WHERE priority IS NULL");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN priority SET DEFAULT 'MEDIUM'");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN priority SET NOT NULL");

                jdbcTemplate.execute("UPDATE complaints SET updated_at = created_at WHERE updated_at IS NULL");
                jdbcTemplate.execute("UPDATE complaints SET updated_at = NOW() WHERE updated_at IS NULL");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN updated_at SET NOT NULL");

                log.info("complaints undo/soft-delete columns verified/updated");
            } catch (Exception ex) {
                log.warn("Failed to add/update complaints undo columns: {}", ex.getMessage());
            }
        };
    }

    @Bean
    public ApplicationRunner repairNoticeUndoColumns() {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE notices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE notices ADD COLUMN IF NOT EXISTS delete_undo_expires_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN");
                jdbcTemplate.execute("UPDATE notices SET is_deleted = FALSE WHERE is_deleted IS NULL");
                jdbcTemplate.execute("ALTER TABLE notices ALTER COLUMN is_deleted SET DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE notices ALTER COLUMN is_deleted SET NOT NULL");
                log.info("notices undo/soft-delete columns verified/updated");
            } catch (Exception ex) {
                log.warn("Failed to add/update notices undo columns: {}", ex.getMessage());
            }
        };
    }

    @Bean
    public ApplicationRunner repairPaymentLifecycleColumns() {
        return args -> {
            // Core relation columns used by Payment entity queries.
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS maintenance_bill_id BIGINT", "payments.maintenance_bill_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_bill_id BIGINT", "payments.vendor_bill_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id BIGINT", "payments.user_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS society_id BIGINT", "payments.society_id");

            // Core payment columns for compatibility with both old and new schemas.
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255)", "payments.razorpay_order_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255)", "payments.razorpay_payment_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255)", "payments.razorpay_signature");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(255)", "payments.payment_type");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255)", "payments.payment_method");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255)", "payments.receipt_number");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_code VARCHAR(255)", "payments.error_code");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_description TEXT", "payments.error_description");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP", "payments.paid_at");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP", "payments.updated_at");

            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP", "payments.deleted_at");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_by BIGINT", "payments.deleted_by");

            // Keep payment lifecycle fields resilient for older databases.
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255)", "payments.refund_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(255)", "payments.refund_status");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2)", "payments.refund_amount");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_initiated_at TIMESTAMP", "payments.refund_initiated_at");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP", "payments.refund_processed_at");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_failure_reason VARCHAR(255)", "payments.refund_failure_reason");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(255)", "payments.settlement_status");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_id VARCHAR(255)", "payments.settlement_id");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_utr VARCHAR(255)", "payments.settlement_utr");
            executeMigrationStep("ALTER TABLE payments ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP", "payments.settled_at");

            // Add FK constraints only if they do not already exist.
            executeMigrationStep(
                "DO $$ BEGIN " +
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_maintenance_bill') THEN " +
                "ALTER TABLE payments ADD CONSTRAINT fk_payments_maintenance_bill FOREIGN KEY (maintenance_bill_id) REFERENCES maintenance_bills(id); " +
                "END IF; " +
                "END $$;",
                "fk_payments_maintenance_bill");

            executeMigrationStep(
                "DO $$ BEGIN " +
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_vendor_bill') THEN " +
                "ALTER TABLE payments ADD CONSTRAINT fk_payments_vendor_bill FOREIGN KEY (vendor_bill_id) REFERENCES vendor_bills(id); " +
                "END IF; " +
                "END $$;",
                "fk_payments_vendor_bill");

            executeMigrationStep(
                "DO $$ BEGIN " +
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_user') THEN " +
                "ALTER TABLE payments ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id); " +
                "END IF; " +
                "END $$;",
                "fk_payments_user");

            executeMigrationStep(
                "DO $$ BEGIN " +
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_society') THEN " +
                "ALTER TABLE payments ADD CONSTRAINT fk_payments_society FOREIGN KEY (society_id) REFERENCES societies(id); " +
                "END IF; " +
                "END $$;",
                "fk_payments_society");

            executeMigrationStep("CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at)", "idx_payments_deleted_at");
            executeMigrationStep("CREATE INDEX IF NOT EXISTS idx_payments_society_deleted_at ON payments(society_id, deleted_at)", "idx_payments_society_deleted_at");
            executeMigrationStep("CREATE INDEX IF NOT EXISTS idx_payments_vendor_bill_id ON payments(vendor_bill_id)", "idx_payments_vendor_bill_id");

            log.info("payments lifecycle/soft-delete columns verified/updated");
        };
    }

        private void executeMigrationStep(String sql, String stepName) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.warn("Migration step failed [{}]: {}", stepName, ex.getMessage());
        }
        }
}