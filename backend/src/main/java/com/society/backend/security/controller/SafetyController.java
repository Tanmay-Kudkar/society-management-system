package com.society.backend.security.controller;

import com.society.backend.security.dto.GateLogRequest;
import com.society.backend.security.dto.GateLogResponse;
import com.society.backend.security.dto.SOSAlertRequest;
import com.society.backend.security.dto.SOSAlertResponse;
import com.society.backend.security.service.SafetyService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/safety")
@PreAuthorize("isAuthenticated()")
public class SafetyController {

    private final SafetyService safetyService;
    private final RoleService roleService;

    public SafetyController(SafetyService safetyService, RoleService roleService) {
        this.safetyService = safetyService;
        this.roleService = roleService;
    }

    // --- SOS Alerts ---

    @PostMapping("/sos")
    public ResponseEntity<SOSAlertResponse> createAlert(
            @RequestParam Long userId,
            @Valid @RequestBody SOSAlertRequest request) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.createAlert(userId, request));
    }

    @GetMapping("/sos")
    public ResponseEntity<List<SOSAlertResponse>> getAllAlerts(@RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getAllAlerts(userId));
    }

    @GetMapping("/sos/society/{societyId}")
    public ResponseEntity<List<SOSAlertResponse>> getAlertsBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getAlertsBySociety(societyId));
    }

    @GetMapping("/sos/society/{societyId}/status/{status}")
    public ResponseEntity<List<SOSAlertResponse>> getAlertsByStatus(
            @PathVariable Long societyId,
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.getAlertsByStatus(societyId, status));
    }

    @GetMapping("/sos/{id}")
    public ResponseEntity<SOSAlertResponse> getAlertById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getAlertById(id));
    }

    @PatchMapping("/sos/{id}/acknowledge")
    public ResponseEntity<SOSAlertResponse> acknowledgeAlert(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.acknowledgeAlert(id, userId));
    }

    @PatchMapping("/sos/{id}/resolve")
    public ResponseEntity<SOSAlertResponse> resolveAlert(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String resolutionNotes) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.resolveAlert(id, userId, resolutionNotes));
    }

    @PatchMapping("/sos/{id}/false-alarm")
    public ResponseEntity<SOSAlertResponse> markFalseAlarm(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(safetyService.markFalseAlarm(id, userId));
    }

    @PatchMapping("/sos/{id}/escalate")
    public ResponseEntity<SOSAlertResponse> escalateAlert(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.escalateAlert(id, userId));
    }

    @GetMapping("/sos/society/{societyId}/priority/{priority}")
    public ResponseEntity<List<SOSAlertResponse>> getAlertsByPriority(
            @PathVariable Long societyId,
            @PathVariable String priority,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getAlertsByPriority(societyId, priority));
    }

    @GetMapping("/sos/society/{societyId}/active")
    public ResponseEntity<List<SOSAlertResponse>> getActiveAndAcknowledgedAlerts(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getActiveAndAcknowledgedAlerts(societyId));
    }

    @GetMapping("/sos/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getAlertCounts(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getAlertCounts(societyId));
    }

    // --- Gate Logs ---

    @PostMapping("/gate-log")
    public ResponseEntity<GateLogResponse> createGateLog(
            @RequestParam Long userId,
            @Valid @RequestBody GateLogRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.createGateLog(userId, request));
    }

    @GetMapping("/gate-log/society/{societyId}")
    public ResponseEntity<List<GateLogResponse>> getGateLogsBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getGateLogsBySociety(societyId));
    }

    @GetMapping("/gate-log/flat/{flatId}")
    public ResponseEntity<List<GateLogResponse>> getGateLogsByFlat(
            @PathVariable Long flatId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getGateLogsByFlat(flatId));
    }

    @GetMapping("/gate-log/society/{societyId}/range")
    public ResponseEntity<List<GateLogResponse>> getGateLogsByDateRange(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.getGateLogsByDateRange(societyId,
                LocalDateTime.parse(start), LocalDateTime.parse(end)));
    }

    @GetMapping("/gate-log/society/{societyId}/type/{entryType}")
    public ResponseEntity<List<GateLogResponse>> getGateLogsByEntryType(
            @PathVariable Long societyId,
            @PathVariable String entryType,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.getGateLogsByEntryType(societyId, entryType));
    }

    @GetMapping("/gate-log/society/{societyId}/status/{status}")
    public ResponseEntity<List<GateLogResponse>> getGateLogsByStatus(
            @PathVariable Long societyId,
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.getGateLogsByStatus(societyId, status));
    }

    @GetMapping("/gate-log/{id}")
    public ResponseEntity<GateLogResponse> getGateLogById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(safetyService.getGateLogById(id));
    }

    @PatchMapping("/gate-log/{id}/exit")
    public ResponseEntity<GateLogResponse> markExit(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(safetyService.markExit(id));
    }

    @DeleteMapping("/gate-log/{id}")
    public ResponseEntity<Void> deleteGateLog(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        safetyService.deleteGateLog(id);
        return ResponseEntity.noContent().build();
    }
}
