package com.society.backend.controller;

import com.society.backend.dto.request.CommonAreaScheduleRequest;
import com.society.backend.dto.response.CommonAreaScheduleResponse;
import com.society.backend.service.commonarea.CommonAreaScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/common-areas")
@RequiredArgsConstructor
public class CommonAreaScheduleController {

    private final CommonAreaScheduleService service;

    @PostMapping
    public ResponseEntity<CommonAreaScheduleResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody CommonAreaScheduleRequest request) {
        return ResponseEntity.ok(service.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommonAreaScheduleResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CommonAreaScheduleRequest request) {
        return ResponseEntity.ok(service.update(id, userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonAreaScheduleResponse> getById(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<CommonAreaScheduleResponse>> getBySociety(
            @PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<CommonAreaScheduleResponse>> getByStatus(
            @PathVariable Long societyId, @PathVariable String status,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByStatus(societyId, status, userId));
    }

    @GetMapping("/society/{societyId}/area-type/{areaType}")
    public ResponseEntity<List<CommonAreaScheduleResponse>> getByAreaType(
            @PathVariable Long societyId, @PathVariable String areaType,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByAreaType(societyId, areaType, userId));
    }

    @GetMapping("/society/{societyId}/maintenance-type/{maintenanceType}")
    public ResponseEntity<List<CommonAreaScheduleResponse>> getByMaintenanceType(
            @PathVariable Long societyId, @PathVariable String maintenanceType,
            @RequestParam Long userId) {
        return ResponseEntity.ok(service.getByMaintenanceType(societyId, maintenanceType, userId));
    }

    @GetMapping("/society/{societyId}/overdue")
    public ResponseEntity<List<CommonAreaScheduleResponse>> getOverdue(
            @PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getOverdue(societyId, userId));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<CommonAreaScheduleResponse> markCompleted(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.markCompleted(id, userId));
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<CommonAreaScheduleResponse> pause(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.pause(id, userId));
    }

    @PatchMapping("/{id}/resume")
    public ResponseEntity<CommonAreaScheduleResponse> resume(
            @PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(service.resume(id, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(
            @PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getCounts(societyId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id, @RequestParam Long userId) {
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
