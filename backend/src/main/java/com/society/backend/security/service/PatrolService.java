package com.society.backend.security.service;

import com.society.backend.security.dto.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface PatrolService {
    // Checkpoints
    CheckpointResponse createCheckpoint(Long userId, CheckpointRequest request);
    List<CheckpointResponse> getCheckpointsBySociety(Long societyId);
    CheckpointResponse updateCheckpoint(Long id, Long userId, CheckpointRequest request);
    void deleteCheckpoint(Long id, Long userId);

    // Patrol Logs
    PatrolLogResponse logPatrol(Long userId, PatrolLogRequest request);
    List<PatrolLogResponse> getPatrolLogsBySociety(Long societyId);
    List<PatrolLogResponse> getPatrolLogsByGuard(Long guardId);
    List<PatrolLogResponse> getPatrolLogsByDateRange(Long societyId, LocalDateTime start, LocalDateTime end);

    // Duty Rosters
    DutyRosterResponse createDutyRoster(Long userId, DutyRosterRequest request);
    List<DutyRosterResponse> getDutyRosterByDate(Long societyId, LocalDate date);
    List<DutyRosterResponse> getDutyRosterByDateRange(Long societyId, LocalDate start, LocalDate end);
    DutyRosterResponse checkIn(Long id, Long userId);
    DutyRosterResponse checkOut(Long id, Long userId);
    DutyRosterResponse markAbsent(Long id, Long userId);
    DutyRosterResponse markLeave(Long id, Long userId);
    void deleteDutyRoster(Long id, Long userId);
}
