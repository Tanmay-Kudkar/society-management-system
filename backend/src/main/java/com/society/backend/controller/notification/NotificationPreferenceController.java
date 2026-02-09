package com.society.backend.controller.notification;

import com.society.backend.dto.notification.NotificationPreferenceRequest;
import com.society.backend.dto.notification.NotificationPreferenceResponse;
import com.society.backend.service.notification.NotificationPreferenceService;
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
