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
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
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

    @PatchMapping("/{id}/undo")
    public ResponseEntity<NoticeResponse> undo(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageNotices(userId);
        return ResponseEntity.ok(noticeService.undo(id));
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean force) {
        roleService.canManageNotices(userId);
        noticeService.delete(id, force);
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
    public ResponseEntity<byte[]> exportAttendance(
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

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Member");
            header.createCell(1).setCellValue("Status");
            header.createCell(2).setCellValue("Marked At");

            int rowIndex = 1;
            for (NoticeAttendanceResponse row : attendance) {
                Row dataRow = sheet.createRow(rowIndex++);
                dataRow.createCell(0).setCellValue(row.getUserName() == null ? "" : row.getUserName());
                dataRow.createCell(1).setCellValue(row.getStatus() == null ? "" : row.getStatus());
                dataRow.createCell(2).setCellValue(row.getMarkedAt() == null ? "" : row.getMarkedAt().toString());
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            sheet.autoSizeColumn(2);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            String filename = "notice-attendance-" + id + "-" + normalizedStatus.toLowerCase() + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export attendance", e);
        }
    }
}
