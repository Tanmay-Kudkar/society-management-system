package com.society.backend.notification.controller;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.response.NoticeResponse;
import com.society.backend.notification.service.NoticeService;
import com.society.backend.common.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.society.backend.society.entity.Society;
@RestController
@RequestMapping("/notices")
@PreAuthorize("isAuthenticated()")
public class NoticeController {

    private final NoticeService noticeService;
    private final RoleService roleService;

    public NoticeController(NoticeService noticeService, RoleService roleService) {
        this.noticeService = noticeService;
        this.roleService = roleService;
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can create
    @PostMapping
    public ResponseEntity<NoticeResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody NoticeRequest request) {
        roleService.canManageNotices(userId);
        return ResponseEntity.ok(noticeService.create(request));
    }

    // All users can view notices
    @GetMapping
    public ResponseEntity<List<NoticeResponse>> getAll() {
        return ResponseEntity.ok(noticeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<NoticeResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(noticeService.getBySocietyId(societyId));
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can update
    @PutMapping("/{id}")
    public ResponseEntity<NoticeResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody NoticeRequest request) {
        roleService.canManageNotices(userId);
        return ResponseEntity.ok(noticeService.update(id, request));
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageNotices(userId);
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
