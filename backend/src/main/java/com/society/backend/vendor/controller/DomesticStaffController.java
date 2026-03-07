package com.society.backend.vendor.controller;

import com.society.backend.vendor.dto.request.DomesticStaffRequest;
import com.society.backend.vendor.dto.response.DomesticStaffResponse;
import com.society.backend.vendor.dto.request.StaffAttendanceRequest;
import com.society.backend.vendor.dto.response.StaffAttendanceResponse;
import com.society.backend.vendor.service.DomesticStaffService;
import com.society.backend.common.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
@RestController
@RequestMapping("/domestic-staff")
@PreAuthorize("isAuthenticated()")
public class DomesticStaffController {

    private final DomesticStaffService staffService;
    private final RoleService roleService;

    public DomesticStaffController(DomesticStaffService staffService, RoleService roleService) {
        this.staffService = staffService;
        this.roleService = roleService;
    }

    // --- Staff CRUD ---

    @PostMapping
    public ResponseEntity<DomesticStaffResponse> createStaff(
            @RequestParam Long userId,
            @Valid @RequestBody DomesticStaffRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(staffService.createStaff(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<DomesticStaffResponse>> getAllStaff(@RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getAllStaff(userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<DomesticStaffResponse>> getStaffBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getStaffBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/active")
    public ResponseEntity<List<DomesticStaffResponse>> getActiveStaff(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getActiveStaffBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/type/{staffType}")
    public ResponseEntity<List<DomesticStaffResponse>> getStaffByType(
            @PathVariable Long societyId,
            @PathVariable String staffType,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getStaffByType(societyId, staffType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DomesticStaffResponse> getStaffById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DomesticStaffResponse> updateStaff(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody DomesticStaffRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(staffService.updateStaff(id, request));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<DomesticStaffResponse> toggleStaffStatus(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(staffService.toggleStaffStatus(id));
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<DomesticStaffResponse> verifyStaff(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(staffService.verifyStaff(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    // --- Attendance ---

    @PostMapping("/attendance")
    public ResponseEntity<StaffAttendanceResponse> recordAttendance(
            @RequestParam Long userId,
            @Valid @RequestBody StaffAttendanceRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(staffService.recordAttendance(userId, request));
    }

    @GetMapping("/attendance/society/{societyId}")
    public ResponseEntity<List<StaffAttendanceResponse>> getAttendanceBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam(required = false) String date) {
        roleService.requireMember(userId);
        LocalDate attendanceDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(staffService.getAttendanceBySociety(societyId, attendanceDate));
    }

    @GetMapping("/attendance/staff/{staffId}")
    public ResponseEntity<List<StaffAttendanceResponse>> getAttendanceByStaff(
            @PathVariable Long staffId,
            @RequestParam Long userId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getAttendanceByStaff(staffId,
                LocalDate.parse(startDate), LocalDate.parse(endDate)));
    }

    @GetMapping("/attendance/flat/{flatId}")
    public ResponseEntity<List<StaffAttendanceResponse>> getAttendanceByFlat(
            @PathVariable Long flatId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(staffService.getAttendanceByFlat(flatId));
    }

    @PatchMapping("/attendance/{attendanceId}/check-out")
    public ResponseEntity<StaffAttendanceResponse> markCheckOut(
            @PathVariable Long attendanceId,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(staffService.markCheckOut(attendanceId));
    }
}
