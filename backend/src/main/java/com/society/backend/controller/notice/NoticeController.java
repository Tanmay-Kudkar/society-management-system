package com.society.backend.controller.notice;

import com.society.backend.dto.notice.NoticeRequest;
import com.society.backend.dto.notice.NoticeResponse;
import com.society.backend.service.notice.NoticeService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notices")
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
