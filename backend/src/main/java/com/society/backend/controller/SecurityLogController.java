package com.society.backend.controller;

import com.society.backend.entity.SecurityLog;
import com.society.backend.service.SecurityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security-logs")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SecurityLogController {
    private final SecurityLogService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN')")
    public ResponseEntity<List<SecurityLog>> getRecentLogs(
            @RequestParam Long societyId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(service.getRecentLogs(societyId, limit));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<SecurityLog> createLog(@RequestBody SecurityLog log) {
        return ResponseEntity.ok(service.createLog(log));
    }
}
