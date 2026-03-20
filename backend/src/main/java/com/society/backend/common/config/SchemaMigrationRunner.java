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
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_previous_status VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_previous_resolution TEXT");
                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_undo_expires_at TIMESTAMP");

                jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN");
                jdbcTemplate.execute("UPDATE complaints SET is_deleted = FALSE WHERE is_deleted IS NULL");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN is_deleted SET DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN is_deleted SET NOT NULL");

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
}