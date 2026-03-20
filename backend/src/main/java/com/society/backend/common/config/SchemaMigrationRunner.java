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

                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS complaint_attachments (complaint_id BIGINT NOT NULL, file_url TEXT)");
                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS complaint_comments (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE, " +
                    "user_id BIGINT NOT NULL REFERENCES users(id), " +
                    "message TEXT NOT NULL, " +
                    "created_at TIMESTAMP NOT NULL DEFAULT NOW(), " +
                    "updated_at TIMESTAMP NOT NULL DEFAULT NOW())");
                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS complaint_history (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE, " +
                    "actor_user_id BIGINT REFERENCES users(id), " +
                    "action_type VARCHAR(64) NOT NULL, " +
                    "from_status VARCHAR(32), " +
                    "to_status VARCHAR(32), " +
                    "note TEXT, " +
                    "created_at TIMESTAMP NOT NULL DEFAULT NOW())");
                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS complaint_uploads (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE, " +
                    "uploaded_by_user_id BIGINT NOT NULL REFERENCES users(id), " +
                    "original_file_name VARCHAR(255) NOT NULL, " +
                    "stored_file_name VARCHAR(255) NOT NULL UNIQUE, " +
                    "content_type VARCHAR(255), " +
                    "file_size BIGINT NOT NULL, " +
                    "file_data BYTEA, " +
                    "created_at TIMESTAMP NOT NULL DEFAULT NOW())");
                jdbcTemplate.execute("ALTER TABLE complaint_uploads ADD COLUMN IF NOT EXISTS file_data BYTEA");

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
}