package com.society.backend.notification.controller;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.request.NoticeAttendanceRequest;
import com.society.backend.notification.dto.response.NoticeAttendanceResponse;
import com.society.backend.notification.dto.response.NoticeResponse;
import com.society.backend.notification.service.NoticeService;
import com.society.backend.common.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
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

    @PostMapping("/{id}/attendance")
    public ResponseEntity<NoticeAttendanceResponse> markAttendance(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestBody(required = false) NoticeAttendanceRequest request) {
        return ResponseEntity.ok(noticeService.markAttendance(id, userId, request));
    }

    @GetMapping("/{id}/attendance/me")
    public ResponseEntity<NoticeAttendanceResponse> getMyAttendance(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(noticeService.getMyAttendance(id, userId));
    }

    @GetMapping("/{id}/attendance")
    public ResponseEntity<List<NoticeAttendanceResponse>> getAttendanceByNotice(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(noticeService.getAttendanceByNotice(id, userId));
    }

    @GetMapping("/{id}/attendance/export")
    public ResponseEntity<byte[]> exportAttendanceCsv(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "ALL") String status) {
        List<NoticeAttendanceResponse> attendance = noticeService.getAttendanceByNotice(id, userId);

        String normalizedStatus = status == null ? "ALL" : status.trim().toUpperCase();
        if (!"ALL".equals(normalizedStatus)) {
            attendance = attendance.stream()
                    .filter(row -> normalizedStatus.equalsIgnoreCase(row.getStatus()))
                    .toList();
        }

        StringBuilder csv = new StringBuilder();
        csv.append("Member,Status,Marked At\n");
        for (NoticeAttendanceResponse row : attendance) {
            csv.append(escapeCsv(row.getUserName())).append(',')
                    .append(escapeCsv(row.getStatus())).append(',')
                    .append(escapeCsv(row.getMarkedAt())).append('\n');
        }

        String filename = "notice-attendance-" + id + "-" + normalizedStatus.toLowerCase() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String escapeCsv(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        if (text.contains(",") || text.contains("\"") || text.contains("\n")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}
