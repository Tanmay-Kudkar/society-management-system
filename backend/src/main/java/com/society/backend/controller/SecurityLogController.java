package com.society.backend.controller;

import com.society.backend.entity.SecurityLog;
import com.society.backend.service.SecurityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SecurityLogController {
    private final SecurityLogService service;

    @GetMapping
    public ResponseEntity<List<SecurityLog>> getRecentLogs(
            @RequestParam Long societyId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(service.getRecentLogs(societyId, limit));
    }

    @PostMapping
    public ResponseEntity<SecurityLog> createLog(@RequestBody SecurityLog log) {
        return ResponseEntity.ok(service.createLog(log));
    }
}
