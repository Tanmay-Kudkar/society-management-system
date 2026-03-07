package com.society.backend.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReferenceCleanupService {

    private final JdbcTemplate jdbcTemplate;

    public void clearReferences(String columnName, Long referenceId, boolean deleteWhenNonNullable, Set<String> excludedTables) {
        Set<String> normalizedExcludes = (excludedTables == null ? Collections.<String>emptySet() : excludedTables)
                .stream()
                .map(table -> table.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        var refs = jdbcTemplate.queryForList(
                "SELECT table_name, is_nullable FROM information_schema.columns " +
                        "WHERE table_schema = current_schema() AND column_name = ?",
                columnName);

        for (Map<String, Object> ref : refs) {
            String table = String.valueOf(ref.get("table_name"));
            if (table == null || table.isBlank()) {
                continue;
            }

            String normalizedTable = table.toLowerCase(Locale.ROOT);
            if (normalizedExcludes.contains(normalizedTable)) {
                continue;
            }

            String isNullable = String.valueOf(ref.get("is_nullable"));
            if ("YES".equalsIgnoreCase(isNullable)) {
                String sql = "UPDATE \"" + table + "\" SET " + columnName + " = NULL WHERE " + columnName + " = ?";
                jdbcTemplate.update(sql, referenceId);
            } else if (deleteWhenNonNullable) {
                String sql = "DELETE FROM \"" + table + "\" WHERE " + columnName + " = ?";
                jdbcTemplate.update(sql, referenceId);
            }
        }
    }
}
