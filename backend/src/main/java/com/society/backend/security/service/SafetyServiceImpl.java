package com.society.backend.security.service;

import com.society.backend.security.dto.GateLogRequest;
import com.society.backend.security.dto.GateLogResponse;
import com.society.backend.security.dto.SOSAlertRequest;
import com.society.backend.security.dto.SOSAlertResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.GateLog;
import com.society.backend.entity.SOSAlert;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.entity.Visitor;
import com.society.backend.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.security.repository.GateLogRepository;
import com.society.backend.security.repository.SOSAlertRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.security.repository.VisitorRepository;
import com.society.backend.service.common.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SafetyServiceImpl implements SafetyService {

    private final SOSAlertRepository sosAlertRepository;
    private final GateLogRepository gateLogRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final VisitorRepository visitorRepository;
    private final RoleService roleService;

    public SafetyServiceImpl(SOSAlertRepository sosAlertRepository, GateLogRepository gateLogRepository,
            UserRepository userRepository, SocietyRepository societyRepository,
            FlatRepository flatRepository, VisitorRepository visitorRepository, RoleService roleService) {
        this.sosAlertRepository = sosAlertRepository;
        this.gateLogRepository = gateLogRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.visitorRepository = visitorRepository;
        this.roleService = roleService;
    }

    // --- SOS Alerts ---

    @Override
    public SOSAlertResponse createAlert(Long userId, SOSAlertRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
        } else if (user.getSociety() != null) {
            society = user.getSociety();
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
        }

        SOSAlert alert = new SOSAlert();
        alert.setAlertType(request.getAlertType());
        alert.setDescription(request.getDescription());
        alert.setRaisedBy(user);
        alert.setSociety(society);
        alert.setPriority(request.getPriority() != null ? request.getPriority() : "HIGH");
        alert.setLocation(request.getLocation());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            alert.setFlat(flat);
        }

        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public List<SOSAlertResponse> getAllAlerts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return sosAlertRepository.findAll().stream()
                    .map(this::toAlertResponse).collect(Collectors.toList());
        }

        if (user.getSociety() != null) {
            return sosAlertRepository.findBySocietyIdOrderByCreatedAtDesc(user.getSociety().getId()).stream()
                    .map(this::toAlertResponse).collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public List<SOSAlertResponse> getAlertsBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return sosAlertRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toAlertResponse).collect(Collectors.toList());
    }

    @Override
    public List<SOSAlertResponse> getAlertsByStatus(Long societyId, String status) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return sosAlertRepository.findBySocietyIdAndStatus(societyId, status).stream()
                .map(this::toAlertResponse).collect(Collectors.toList());
    }

    @Override
    public List<SOSAlertResponse> getAlertsByPriority(Long societyId, String priority) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return sosAlertRepository.findBySocietyIdAndPriorityOrderByCreatedAtDesc(societyId, priority).stream()
                .map(this::toAlertResponse).collect(Collectors.toList());
    }

    @Override
    public List<SOSAlertResponse> getActiveAndAcknowledgedAlerts(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return sosAlertRepository.findBySocietyIdAndStatusInOrderByCreatedAtDesc(
                    societyId, List.of("ACTIVE", "ACKNOWLEDGED")).stream()
                .map(this::toAlertResponse).collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getAlertCounts(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        Map<String, Long> counts = new HashMap<>();
        counts.put("active", sosAlertRepository.countBySocietyIdAndStatus(societyId, "ACTIVE"));
        counts.put("acknowledged", sosAlertRepository.countBySocietyIdAndStatus(societyId, "ACKNOWLEDGED"));
        counts.put("resolved", sosAlertRepository.countBySocietyIdAndStatus(societyId, "RESOLVED"));
        counts.put("falseAlarm", sosAlertRepository.countBySocietyIdAndStatus(societyId, "FALSE_ALARM"));
        counts.put("pending", sosAlertRepository.countBySocietyIdAndStatusIn(societyId, List.of("ACTIVE", "ACKNOWLEDGED")));
        return counts;
    }

    @Override
    public SOSAlertResponse getAlertById(Long id) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), alert.getSociety().getId());
        return toAlertResponse(alert);
    }

    @Override
    public SOSAlertResponse acknowledgeAlert(Long id, Long userId) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), alert.getSociety().getId());

        if (!"ACTIVE".equals(alert.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only ACTIVE alerts can be acknowledged. Current status: " + alert.getStatus());
        }

        User acknowledger = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(acknowledger);
        alert.setAcknowledgedAt(LocalDateTime.now());

        // Compute response time in seconds from creation
        long seconds = ChronoUnit.SECONDS.between(alert.getCreatedAt(), LocalDateTime.now());
        alert.setResponseTimeSeconds((int) seconds);

        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public SOSAlertResponse resolveAlert(Long id, Long userId, String resolutionNotes) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), alert.getSociety().getId());

        if ("RESOLVED".equals(alert.getStatus()) || "FALSE_ALARM".equals(alert.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Alert is already " + alert.getStatus() + " and cannot be resolved again.");
        }

        User resolver = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        alert.setStatus("RESOLVED");
        alert.setResolvedBy(resolver);
        alert.setResolutionNotes(resolutionNotes);
        alert.setResolvedAt(LocalDateTime.now());

        // Set response time if not yet set (direct resolve without acknowledge)
        if (alert.getResponseTimeSeconds() == null) {
            long seconds = ChronoUnit.SECONDS.between(alert.getCreatedAt(), LocalDateTime.now());
            alert.setResponseTimeSeconds((int) seconds);
        }

        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public SOSAlertResponse markFalseAlarm(Long id, Long userId) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), alert.getSociety().getId());

        if ("RESOLVED".equals(alert.getStatus()) || "FALSE_ALARM".equals(alert.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Alert is already " + alert.getStatus() + " and cannot be changed.");
        }

        User resolver = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        alert.setStatus("FALSE_ALARM");
        alert.setResolvedBy(resolver);
        alert.setResolvedAt(LocalDateTime.now());
        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public SOSAlertResponse escalateAlert(Long id, Long userId) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), alert.getSociety().getId());

        if ("RESOLVED".equals(alert.getStatus()) || "FALSE_ALARM".equals(alert.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot escalate a closed alert.");
        }

        // Bump escalation level (max 4)
        int newLevel = Math.min(alert.getEscalationLevel() + 1, 4);
        alert.setEscalationLevel(newLevel);
        alert.setEscalatedAt(LocalDateTime.now());

        // Auto-bump priority on escalation
        String[] priorities = { "LOW", "MEDIUM", "HIGH", "CRITICAL" };
        int currentIdx = java.util.Arrays.asList(priorities).indexOf(alert.getPriority());
        if (currentIdx >= 0 && currentIdx < priorities.length - 1) {
            alert.setPriority(priorities[currentIdx + 1]);
        }

        return toAlertResponse(sosAlertRepository.save(alert));
    }

    // --- Gate Logs ---

    @Override
    public GateLogResponse createGateLog(Long userId, GateLogRequest request) {
        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
            if (user.getSociety() != null) {
                society = user.getSociety();
            } else {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
            }
        }

        GateLog log = new GateLog();
        log.setEntryType(request.getEntryType());
        log.setPersonName(request.getPersonName());
        log.setPersonPhone(request.getPersonPhone());
        log.setVehicleNumber(request.getVehicleNumber());
        log.setSociety(society);
        log.setEntryTime(request.getEntryTime() != null ? request.getEntryTime() : LocalDateTime.now());
        log.setExitTime(request.getExitTime());
        log.setEntryGate(request.getEntryGate());
        log.setExitGate(request.getExitGate());
        log.setPurpose(request.getPurpose());
        log.setNotes(request.getNotes());
        log.setStatus("IN");
        log.setImageUrl(request.getImageUrl());
        log.setIdType(request.getIdType());
        log.setIdNumber(request.getIdNumber());
        log.setCompanyName(request.getCompanyName());
        log.setItemsCarried(request.getItemsCarried());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            log.setFlat(flat);
        }

        if (request.getVisitorId() != null) {
            Visitor visitor = visitorRepository.findById(request.getVisitorId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
            log.setVisitor(visitor);
        }

        // Set approvedBy to current user creating the log
        User approver = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        log.setApprovedBy(approver);

        return toGateLogResponse(gateLogRepository.save(log));
    }

    @Override
    public List<GateLogResponse> getGateLogsBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return gateLogRepository.findBySocietyIdOrderByEntryTimeDesc(societyId).stream()
                .map(this::toGateLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<GateLogResponse> getGateLogsByFlat(Long flatId) {
        return gateLogRepository.findByFlatId(flatId).stream()
                .map(this::toGateLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<GateLogResponse> getGateLogsByDateRange(Long societyId, LocalDateTime start, LocalDateTime end) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return gateLogRepository.findBySocietyIdAndEntryTimeBetween(societyId, start, end).stream()
                .map(this::toGateLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<GateLogResponse> getGateLogsByEntryType(Long societyId, String entryType) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return gateLogRepository.findBySocietyIdAndEntryTypeOrderByEntryTimeDesc(societyId, entryType).stream()
                .map(this::toGateLogResponse).collect(Collectors.toList());
    }

    @Override
    public List<GateLogResponse> getGateLogsByStatus(Long societyId, String status) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return gateLogRepository.findBySocietyIdAndStatusOrderByEntryTimeDesc(societyId, status).stream()
                .map(this::toGateLogResponse).collect(Collectors.toList());
    }

    @Override
    public GateLogResponse getGateLogById(Long id) {
        GateLog log = gateLogRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Gate log not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), log.getSociety().getId());
        return toGateLogResponse(log);
    }

    @Override
    public GateLogResponse markExit(Long id) {
        GateLog log = gateLogRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Gate log not found"));
        log.setExitTime(LocalDateTime.now());
        log.setStatus("OUT");
        return toGateLogResponse(gateLogRepository.save(log));
    }

    @Override
    public void deleteGateLog(Long id) {
        if (!gateLogRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Gate log not found");
        }
        gateLogRepository.deleteById(id);
    }

    // --- Mappers ---

    private SOSAlertResponse toAlertResponse(SOSAlert alert) {
        SOSAlertResponse response = new SOSAlertResponse();
        response.setId(alert.getId());
        response.setAlertType(alert.getAlertType());
        response.setDescription(alert.getDescription());
        response.setRaisedById(alert.getRaisedBy().getId());
        response.setRaisedByName(alert.getRaisedBy().getName());
        if (alert.getFlat() != null) {
            response.setFlatId(alert.getFlat().getId());
            response.setFlatNumber(alert.getFlat().getFlatNumber());
        }
        response.setSocietyId(alert.getSociety().getId());
        response.setSocietyName(alert.getSociety().getName());
        response.setStatus(alert.getStatus());
        response.setPriority(alert.getPriority());
        if (alert.getResolvedBy() != null) {
            response.setResolvedByName(alert.getResolvedBy().getName());
        }
        response.setResolutionNotes(alert.getResolutionNotes());
        response.setLocation(alert.getLocation());
        response.setEscalationLevel(alert.getEscalationLevel());
        response.setEscalatedAt(alert.getEscalatedAt());
        if (alert.getAcknowledgedBy() != null) {
            response.setAcknowledgedByName(alert.getAcknowledgedBy().getName());
        }
        response.setResponseTimeSeconds(alert.getResponseTimeSeconds());
        response.setCreatedAt(alert.getCreatedAt());
        response.setAcknowledgedAt(alert.getAcknowledgedAt());
        response.setResolvedAt(alert.getResolvedAt());
        return response;
    }

    private GateLogResponse toGateLogResponse(GateLog log) {
        GateLogResponse response = new GateLogResponse();
        response.setId(log.getId());
        response.setEntryType(log.getEntryType());
        response.setPersonName(log.getPersonName());
        response.setPersonPhone(log.getPersonPhone());
        response.setVehicleNumber(log.getVehicleNumber());
        if (log.getFlat() != null) {
            response.setFlatId(log.getFlat().getId());
            response.setFlatNumber(log.getFlat().getFlatNumber());
        }
        response.setSocietyId(log.getSociety().getId());
        response.setSocietyName(log.getSociety().getName());
        response.setEntryTime(log.getEntryTime());
        response.setExitTime(log.getExitTime());
        response.setEntryGate(log.getEntryGate());
        response.setExitGate(log.getExitGate());
        response.setPurpose(log.getPurpose());
        response.setStatus(log.getStatus());
        response.setNotes(log.getNotes());
        response.setImageUrl(log.getImageUrl());
        response.setIdType(log.getIdType());
        response.setIdNumber(log.getIdNumber());
        response.setCompanyName(log.getCompanyName());
        response.setItemsCarried(log.getItemsCarried());
        if (log.getVisitor() != null) {
            response.setVisitorId(log.getVisitor().getId());
        }
        if (log.getApprovedBy() != null) {
            response.setApprovedByName(log.getApprovedBy().getName());
        }
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }
}
