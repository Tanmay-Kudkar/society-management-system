package com.society.backend.vendor.controller;

import com.society.backend.vendor.dto.request.StaffShiftRequest;
import com.society.backend.vendor.dto.response.StaffShiftResponse;
import com.society.backend.vendor.service.StaffShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.society.backend.society.entity.Society;
@RestController
@RequestMapping("/staff-shifts")
@RequiredArgsConstructor
public class StaffShiftController {

    private final StaffShiftService service;

    @PostMapping
    public ResponseEntity<StaffShiftResponse> create(
            @RequestParam Long userId, @Valid @RequestBody StaffShiftRequest request) {
        return ResponseEntity.ok(service.create(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffShiftResponse> getById(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<StaffShiftResponse>> getBySociety(
            @PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/date")
    public ResponseEntity<List<StaffShiftResponse>> getByDate(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByDate(societyId, date, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<StaffShiftResponse>> getByStatus(
            @PathVariable Long societyId, @PathVariable String status,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByStatus(societyId, status, userId));
    }

    @GetMapping("/staff/{staffUserId}")
    public ResponseEntity<List<StaffShiftResponse>> getByStaff(
            @PathVariable Long staffUserId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByStaff(staffUserId, userId));
    }

    @GetMapping("/society/{societyId}/range")
    public ResponseEntity<List<StaffShiftResponse>> getByDateRange(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByDateRange(societyId, start, end, userId));
    }

    @PatchMapping("/{id}/check-in")
    public ResponseEntity<StaffShiftResponse> checkIn(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.checkIn(id, userId));
    }

    @PatchMapping("/{id}/check-out")
    public ResponseEntity<StaffShiftResponse> checkOut(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.checkOut(id, userId));
    }

    @PatchMapping("/{id}/absent")
    public ResponseEntity<StaffShiftResponse> markAbsent(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.markAbsent(id, userId));
    }

    @GetMapping("/society/{societyId}/day-counts")
    public ResponseEntity<Map<String, Long>> getDayCounts(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getDayCounts(societyId, date, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id, @RequestParam Long userId) {
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
