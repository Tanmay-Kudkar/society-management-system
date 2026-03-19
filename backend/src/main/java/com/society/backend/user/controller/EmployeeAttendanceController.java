package com.society.backend.user.controller;

import com.society.backend.user.dto.request.EmployeeAttendanceRequest;
import com.society.backend.user.dto.response.EmployeeAttendanceResponse;
import com.society.backend.user.service.EmployeeAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employee-attendance")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmployeeAttendanceController {

    private final EmployeeAttendanceService employeeAttendanceService;

    @PostMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeAttendanceResponse> markAttendance(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeAttendanceRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeAttendanceService.markAttendance(employeeId, request, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<EmployeeAttendanceResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeAttendanceService.getBySociety(
                societyId,
                fromDate,
                toDate,
                status,
                PageRequest.of(page, size, Sort.by("attendanceDate").descending()),
                userId
        ));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeAttendanceResponse>> getByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeAttendanceService.getByEmployee(employeeId, fromDate, toDate, userId));
    }

    @GetMapping("/society/{societyId}/summary")
    public ResponseEntity<Map<String, Long>> getSummary(
            @PathVariable Long societyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeAttendanceService.getSummary(societyId, fromDate, toDate, userId));
    }
}
