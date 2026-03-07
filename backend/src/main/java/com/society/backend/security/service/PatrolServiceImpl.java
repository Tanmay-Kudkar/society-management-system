package com.society.backend.security.service;

import com.society.backend.security.dto.request.*;
import com.society.backend.security.dto.response.*;
import com.society.backend.common.exception.ApiException;
import com.society.backend.security.repository.*;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.security.entity.DutyRoster;
import com.society.backend.security.entity.PatrolCheckpoint;
import com.society.backend.security.entity.PatrolLog;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Service
public class PatrolServiceImpl implements PatrolService {

    private final PatrolCheckpointRepository checkpointRepository;
    private final PatrolLogRepository patrolLogRepository;
    private final DutyRosterRepository dutyRosterRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public PatrolServiceImpl(PatrolCheckpointRepository checkpointRepository,
                             PatrolLogRepository patrolLogRepository,
                             DutyRosterRepository dutyRosterRepository,
                             UserRepository userRepository,
                             SocietyRepository societyRepository,
                             RoleService roleService) {
        this.checkpointRepository = checkpointRepository;
        this.patrolLogRepository = patrolLogRepository;
        this.dutyRosterRepository = dutyRosterRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    // ─── Checkpoints ───

    @Override
    public CheckpointResponse createCheckpoint(Long userId, CheckpointRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society = resolveSociety(user, request.getSocietyId());
        roleService.enforceSocietyScope(user, society.getId());

        PatrolCheckpoint cp = new PatrolCheckpoint();
        cp.setSociety(society);
        cp.setCheckpointName(request.getCheckpointName());
        cp.setLocation(request.getLocation());
        cp.setDescription(request.getDescription());
        cp.setQrCode(request.getQrCode());
        cp.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

        return toCheckpointResponse(checkpointRepository.save(cp));
    }

    @Override
    public List<CheckpointResponse> getCheckpointsBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return checkpointRepository.findBySocietyIdOrderByDisplayOrderAsc(societyId).stream()
                .map(this::toCheckpointResponse).collect(Collectors.toList());
    }

    @Override
    public CheckpointResponse updateCheckpoint(Long id, Long userId, CheckpointRequest request) {
        PatrolCheckpoint cp = checkpointRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Checkpoint not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), cp.getSociety().getId());

        if (request.getCheckpointName() != null) cp.setCheckpointName(request.getCheckpointName());
        if (request.getLocation() != null) cp.setLocation(request.getLocation());
        if (request.getDescription() != null) cp.setDescription(request.getDescription());
        if (request.getQrCode() != null) cp.setQrCode(request.getQrCode());
        if (request.getDisplayOrder() != null) cp.setDisplayOrder(request.getDisplayOrder());

        return toCheckpointResponse(checkpointRepository.save(cp));
    }

    @Override
    public void deleteCheckpoint(Long id, Long userId) {
        PatrolCheckpoint cp = checkpointRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Checkpoint not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), cp.getSociety().getId());
        cp.setActive(false);
        checkpointRepository.save(cp);
    }

    // ─── Patrol Logs ───

    @Override
    public PatrolLogResponse logPatrol(Long userId, PatrolLogRequest request) {
        User guard = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society = resolveSociety(guard, request.getSocietyId());
        roleService.enforceSocietyScope(guard, society.getId());

        PatrolCheckpoint checkpoint = checkpointRepository.findById(request.getCheckpointId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Checkpoint not found"));

        if (!checkpoint.getSociety().getId().equals(society.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Checkpoint does not belong to this society");
        }

        PatrolLog log = new PatrolLog();
        log.setSociety(society);
        log.setGuard(guard);
        log.setCheckpoint(checkpoint);
        log.setNotes(request.getNotes());
        log.setLatitude(request.getLatitude());
        log.setLongitude(request.getLongitude());

        return toPatrolLogResponse(patrolLogRepository.save(log));
    }

    @Override
    public List<PatrolLogResponse> getPatrolLogsBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return patrolLogRepository.findBySocietyIdOrderByScannedAtDesc(societyId).stream()
                .map(this::toPatrolLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<PatrolLogResponse> getPatrolLogsByGuard(Long guardId) {
        return patrolLogRepository.findByGuardIdOrderByScannedAtDesc(guardId).stream()
                .map(this::toPatrolLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<PatrolLogResponse> getPatrolLogsByDateRange(Long societyId, LocalDateTime start, LocalDateTime end) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return patrolLogRepository.findBySocietyIdAndScannedAtBetweenOrderByScannedAtDesc(societyId, start, end)
                .stream().map(this::toPatrolLogResponse).collect(Collectors.toList());
    }

    // ─── Duty Rosters ───

    @Override
    public DutyRosterResponse createDutyRoster(Long userId, DutyRosterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society = resolveSociety(user, request.getSocietyId());
        roleService.enforceSocietyScope(user, society.getId());

        User guard = userRepository.findById(request.getGuardId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Guard not found"));

        DutyRoster roster = new DutyRoster();
        roster.setSociety(society);
        roster.setGuard(guard);
        roster.setShiftName(request.getShiftName());
        roster.setShiftStart(request.getShiftStart());
        roster.setShiftEnd(request.getShiftEnd());
        roster.setDutyDate(request.getDutyDate());
        roster.setNotes(request.getNotes());

        return toDutyRosterResponse(dutyRosterRepository.save(roster));
    }

    @Override
    public List<DutyRosterResponse> getDutyRosterByDate(Long societyId, LocalDate date) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return dutyRosterRepository.findBySocietyIdAndDutyDateOrderByShiftStartAsc(societyId, date).stream()
                .map(this::toDutyRosterResponse).collect(Collectors.toList());
    }

    @Override
    public List<DutyRosterResponse> getDutyRosterByDateRange(Long societyId, LocalDate start, LocalDate end) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return dutyRosterRepository.findBySocietyIdAndDutyDateBetweenOrderByDutyDateAscShiftStartAsc(societyId, start, end)
                .stream().map(this::toDutyRosterResponse).collect(Collectors.toList());
    }

    @Override
    public DutyRosterResponse checkIn(Long id, Long userId) {
        DutyRoster roster = dutyRosterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Duty roster entry not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), roster.getSociety().getId());

        if (!"SCHEDULED".equals(roster.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Can only check in from SCHEDULED status");
        }

        roster.setStatus("ON_DUTY");
        roster.setCheckInTime(LocalDateTime.now());
        return toDutyRosterResponse(dutyRosterRepository.save(roster));
    }

    @Override
    public DutyRosterResponse checkOut(Long id, Long userId) {
        DutyRoster roster = dutyRosterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Duty roster entry not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), roster.getSociety().getId());

        if (!"ON_DUTY".equals(roster.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Can only check out from ON_DUTY status");
        }

        roster.setStatus("COMPLETED");
        roster.setCheckOutTime(LocalDateTime.now());
        return toDutyRosterResponse(dutyRosterRepository.save(roster));
    }

    @Override
    public DutyRosterResponse markAbsent(Long id, Long userId) {
        DutyRoster roster = dutyRosterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Duty roster entry not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), roster.getSociety().getId());

        roster.setStatus("ABSENT");
        return toDutyRosterResponse(dutyRosterRepository.save(roster));
    }

    @Override
    public DutyRosterResponse markLeave(Long id, Long userId) {
        DutyRoster roster = dutyRosterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Duty roster entry not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), roster.getSociety().getId());

        roster.setStatus("LEAVE");
        return toDutyRosterResponse(dutyRosterRepository.save(roster));
    }

    @Override
    public void deleteDutyRoster(Long id, Long userId) {
        DutyRoster roster = dutyRosterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Duty roster entry not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), roster.getSociety().getId());
        dutyRosterRepository.delete(roster);
    }

    // ─── Helpers ───

    private Society resolveSociety(User user, Long societyId) {
        if (societyId != null) {
            return societyRepository.findById(societyId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        }
        if (user.getSociety() != null) return user.getSociety();
        throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
    }

    // ─── Mappers ───

    private CheckpointResponse toCheckpointResponse(PatrolCheckpoint cp) {
        CheckpointResponse r = new CheckpointResponse();
        r.setId(cp.getId());
        r.setSocietyId(cp.getSociety().getId());
        r.setCheckpointName(cp.getCheckpointName());
        r.setLocation(cp.getLocation());
        r.setDescription(cp.getDescription());
        r.setQrCode(cp.getQrCode());
        r.setDisplayOrder(cp.getDisplayOrder());
        r.setActive(cp.isActive());
        r.setCreatedAt(cp.getCreatedAt());
        return r;
    }

    private PatrolLogResponse toPatrolLogResponse(PatrolLog log) {
        PatrolLogResponse r = new PatrolLogResponse();
        r.setId(log.getId());
        r.setSocietyId(log.getSociety().getId());
        r.setGuardId(log.getGuard().getId());
        r.setGuardName(log.getGuard().getName());
        r.setCheckpointId(log.getCheckpoint().getId());
        r.setCheckpointName(log.getCheckpoint().getCheckpointName());
        r.setCheckpointLocation(log.getCheckpoint().getLocation());
        r.setScannedAt(log.getScannedAt());
        r.setStatus(log.getStatus());
        r.setNotes(log.getNotes());
        r.setLatitude(log.getLatitude());
        r.setLongitude(log.getLongitude());
        r.setCreatedAt(log.getCreatedAt());
        return r;
    }

    private DutyRosterResponse toDutyRosterResponse(DutyRoster roster) {
        DutyRosterResponse r = new DutyRosterResponse();
        r.setId(roster.getId());
        r.setSocietyId(roster.getSociety().getId());
        r.setGuardId(roster.getGuard().getId());
        r.setGuardName(roster.getGuard().getName());
        r.setShiftName(roster.getShiftName());
        r.setShiftStart(roster.getShiftStart());
        r.setShiftEnd(roster.getShiftEnd());
        r.setDutyDate(roster.getDutyDate());
        r.setStatus(roster.getStatus());
        r.setCheckInTime(roster.getCheckInTime());
        r.setCheckOutTime(roster.getCheckOutTime());
        r.setNotes(roster.getNotes());
        r.setCreatedAt(roster.getCreatedAt());
        return r;
    }
}
