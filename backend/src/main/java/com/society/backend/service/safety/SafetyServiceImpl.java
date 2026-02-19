package com.society.backend.service.safety;

import com.society.backend.dto.safety.GateLogRequest;
import com.society.backend.dto.safety.GateLogResponse;
import com.society.backend.dto.safety.SOSAlertRequest;
import com.society.backend.dto.safety.SOSAlertResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.GateLog;
import com.society.backend.entity.SOSAlert;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.safety.GateLogRepository;
import com.society.backend.repository.safety.SOSAlertRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.common.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SafetyServiceImpl implements SafetyService {

    private final SOSAlertRepository sosAlertRepository;
    private final GateLogRepository gateLogRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    public SafetyServiceImpl(SOSAlertRepository sosAlertRepository, GateLogRepository gateLogRepository,
            UserRepository userRepository, SocietyRepository societyRepository,
            FlatRepository flatRepository, RoleService roleService) {
        this.sosAlertRepository = sosAlertRepository;
        this.gateLogRepository = gateLogRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
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
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedAt(LocalDateTime.now());
        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public SOSAlertResponse resolveAlert(Long id, Long userId, String resolutionNotes) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        User resolver = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        alert.setStatus("RESOLVED");
        alert.setResolvedBy(resolver);
        alert.setResolutionNotes(resolutionNotes);
        alert.setResolvedAt(LocalDateTime.now());
        return toAlertResponse(sosAlertRepository.save(alert));
    }

    @Override
    public SOSAlertResponse markFalseAlarm(Long id, Long userId) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SOS Alert not found"));
        User resolver = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        alert.setStatus("FALSE_ALARM");
        alert.setResolvedBy(resolver);
        alert.setResolvedAt(LocalDateTime.now());
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

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            log.setFlat(flat);
        }

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
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }
}
