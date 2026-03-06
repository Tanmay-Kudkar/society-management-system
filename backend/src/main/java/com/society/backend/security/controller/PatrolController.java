package com.society.backend.security.controller;

import com.society.backend.security.dto.*;
import com.society.backend.security.service.PatrolService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/patrol")
@PreAuthorize("isAuthenticated()")
public class PatrolController {

    private final PatrolService patrolService;
    private final RoleService roleService;

    public PatrolController(PatrolService patrolService, RoleService roleService) {
        this.patrolService = patrolService;
        this.roleService = roleService;
    }

    // ─── Checkpoints ───

    @PostMapping("/checkpoints")
    public ResponseEntity<CheckpointResponse> createCheckpoint(
            @RequestParam Long userId,
            @Valid @RequestBody CheckpointRequest request) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(patrolService.createCheckpoint(userId, request));
    }

    @GetMapping("/checkpoints/society/{societyId}")
    public ResponseEntity<List<CheckpointResponse>> getCheckpoints(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(patrolService.getCheckpointsBySociety(societyId));
    }

    @PutMapping("/checkpoints/{id}")
    public ResponseEntity<CheckpointResponse> updateCheckpoint(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CheckpointRequest request) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(patrolService.updateCheckpoint(id, userId, request));
    }

    @DeleteMapping("/checkpoints/{id}")
    public ResponseEntity<Void> deleteCheckpoint(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        patrolService.deleteCheckpoint(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Patrol Logs ───

    @PostMapping("/logs")
    public ResponseEntity<PatrolLogResponse> logPatrol(
            @RequestParam Long userId,
            @RequestBody PatrolLogRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.logPatrol(userId, request));
    }

    @GetMapping("/logs/society/{societyId}")
    public ResponseEntity<List<PatrolLogResponse>> getPatrolLogs(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(patrolService.getPatrolLogsBySociety(societyId));
    }

    @GetMapping("/logs/guard/{guardId}")
    public ResponseEntity<List<PatrolLogResponse>> getPatrolLogsByGuard(
            @PathVariable Long guardId,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.getPatrolLogsByGuard(guardId));
    }

    @GetMapping("/logs/society/{societyId}/range")
    public ResponseEntity<List<PatrolLogResponse>> getPatrolLogsByDateRange(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.getPatrolLogsByDateRange(societyId,
                LocalDateTime.parse(start), LocalDateTime.parse(end)));
    }

    // ─── Duty Rosters ───

    @PostMapping("/duty")
    public ResponseEntity<DutyRosterResponse> createDutyRoster(
            @RequestParam Long userId,
            @Valid @RequestBody DutyRosterRequest request) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(patrolService.createDutyRoster(userId, request));
    }

    @GetMapping("/duty/society/{societyId}")
    public ResponseEntity<List<DutyRosterResponse>> getDutyRosterByDate(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam String date) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(patrolService.getDutyRosterByDate(societyId, LocalDate.parse(date)));
    }

    @GetMapping("/duty/society/{societyId}/range")
    public ResponseEntity<List<DutyRosterResponse>> getDutyRosterByDateRange(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.getDutyRosterByDateRange(societyId,
                LocalDate.parse(start), LocalDate.parse(end)));
    }

    @PatchMapping("/duty/{id}/check-in")
    public ResponseEntity<DutyRosterResponse> checkIn(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.checkIn(id, userId));
    }

    @PatchMapping("/duty/{id}/check-out")
    public ResponseEntity<DutyRosterResponse> checkOut(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(patrolService.checkOut(id, userId));
    }

    @PatchMapping("/duty/{id}/absent")
    public ResponseEntity<DutyRosterResponse> markAbsent(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(patrolService.markAbsent(id, userId));
    }

    @PatchMapping("/duty/{id}/leave")
    public ResponseEntity<DutyRosterResponse> markLeave(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(patrolService.markLeave(id, userId));
    }

    @DeleteMapping("/duty/{id}")
    public ResponseEntity<Void> deleteDutyRoster(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        patrolService.deleteDutyRoster(id, userId);
        return ResponseEntity.noContent().build();
    }
}
