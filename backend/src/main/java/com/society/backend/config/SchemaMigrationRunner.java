package com.society.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class SchemaMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    public ApplicationRunner repairUserRoleConstraint() {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
                jdbcTemplate.execute("UPDATE users SET role = 'PLATFORM_OWNER' WHERE role = 'MASTER_ADMIN'");
                jdbcTemplate.execute(
                    "UPDATE users SET role = 'VISITOR' " +
                    "WHERE role IS NULL OR role NOT IN ('PLATFORM_OWNER','ORGANIZATION_OWNER','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER','EMPLOYEE','MEMBER','TENANT','VISITOR')"
                );
                jdbcTemplate.execute("UPDATE users SET account_type = 'SOCIETY_ADMIN' WHERE account_type = 'ORGANIZATION_OWNER'");
                jdbcTemplate.execute("UPDATE users SET account_type = NULL WHERE account_type IS NOT NULL AND account_type <> 'SOCIETY_ADMIN'");
                jdbcTemplate.execute(
                        "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                    "CHECK (role IN ('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'))"
                );
                log.info("users_role_check constraint verified/updated");
            } catch (Exception ex) {
                log.warn("Failed to update users_role_check constraint: {}", ex.getMessage());
            }
        };
    }
}