package com.society.backend.notice.controller;

import com.society.backend.notice.dto.NotificationPreferenceRequest;
import com.society.backend.notice.dto.NotificationPreferenceResponse;
import com.society.backend.notice.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notification-preferences")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(preferenceService.getByUserId(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> update(
            @PathVariable Long userId,
            @RequestBody NotificationPreferenceRequest request) {
        return ResponseEntity.ok(preferenceService.update(userId, request));
    }
}
