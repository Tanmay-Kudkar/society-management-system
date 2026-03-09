package com.society.backend.notification.controller;

import com.society.backend.common.exception.AccessDeniedException;
import com.society.backend.common.service.RoleService;
import com.society.backend.notification.dto.request.NotificationPreferenceRequest;
import com.society.backend.notification.dto.response.NotificationPreferenceResponse;
import com.society.backend.notification.service.NotificationPreferenceService;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
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
    private final RoleService roleService;

    @GetMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> getByUserId(@PathVariable Long userId) {
        validateAccess(userId);
        return ResponseEntity.ok(preferenceService.getByUserId(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> update(
            @PathVariable Long userId,
            @RequestBody NotificationPreferenceRequest request) {
        validateAccess(userId);
        return ResponseEntity.ok(preferenceService.update(userId, request));
    }

    private void validateAccess(Long userId) {
        User currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new AccessDeniedException("Access denied. Not authenticated.");
        }

        boolean isMasterAdmin = currentUser.getRole() == Role.MASTER_ADMIN;
        boolean isSelf = currentUser.getId() != null && currentUser.getId().equals(userId);
        if (!isMasterAdmin && !isSelf) {
            throw new AccessDeniedException("Access denied. You can only manage your own notification preferences.");
        }
    }
}
