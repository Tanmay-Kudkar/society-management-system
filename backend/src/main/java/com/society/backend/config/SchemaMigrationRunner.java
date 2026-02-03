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
                jdbcTemplate.execute(
                        "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                        "CHECK (role IN ('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'))"
                );
                log.info("users_role_check constraint verified/updated");
            } catch (Exception ex) {
                log.warn("Failed to update users_role_check constraint: {}", ex.getMessage());
            }
        };
    }
}