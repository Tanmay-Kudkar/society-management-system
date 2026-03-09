package com.society.backend.security.controller;

import com.society.backend.security.dto.request.VisitorRequest;
import com.society.backend.security.dto.response.VisitorResponse;
import com.society.backend.security.service.VisitorService;
import com.society.backend.common.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
@RestController
@RequestMapping("/visitors")
@PreAuthorize("isAuthenticated()")
public class VisitorController {

    private final VisitorService visitorService;
    private final RoleService roleService;

    public VisitorController(VisitorService visitorService, RoleService roleService) {
        this.visitorService = visitorService;
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<VisitorResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody VisitorRequest request) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.create(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<VisitorResponse>> getAll(@RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getAll(userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<VisitorResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/today")
    public ResponseEntity<List<VisitorResponse>> getTodayArrivals(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getTodayArrivals(societyId, userId));
    }

    @GetMapping("/society/{societyId}/overstayed")
    public ResponseEntity<List<VisitorResponse>> getOverstayed(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam(required = false) Integer thresholdHours) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(visitorService.getOverstayed(societyId, userId, thresholdHours));
    }

    @GetMapping("/society/{societyId}/range")
    public ResponseEntity<List<VisitorResponse>> getByDateRange(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getBySocietyAndDateRange(societyId, userId, fromDate, toDate));
    }

    @GetMapping("/flat/{flatId}")
    public ResponseEntity<List<VisitorResponse>> getByFlat(
            @PathVariable Long flatId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getByFlat(flatId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<VisitorResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getByStatus(status));
    }

    @GetMapping("/type/{visitorType}")
    public ResponseEntity<List<VisitorResponse>> getByType(
            @PathVariable String visitorType,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getByType(visitorType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitorResponse> getById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.getById(id));
    }

    @PatchMapping("/{id}/check-in")
    public ResponseEntity<VisitorResponse> checkIn(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(visitorService.checkIn(id, userId));
    }

    @PatchMapping("/{id}/check-out")
    public ResponseEntity<VisitorResponse> checkOut(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(visitorService.checkOut(id, userId));
    }

    @PostMapping("/{id}/otp/generate")
    public ResponseEntity<VisitorResponse> generateOtp(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(visitorService.generateOtp(id, userId));
    }

    @PostMapping("/{id}/otp/verify")
    public ResponseEntity<VisitorResponse> verifyOtp(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String otpCode) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(visitorService.verifyOtp(id, userId, otpCode));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<VisitorResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String status) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(visitorService.updateStatus(id, status, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        visitorService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
