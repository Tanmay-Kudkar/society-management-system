package com.society.backend.service.safety;

import com.society.backend.dto.safety.GateLogRequest;
import com.society.backend.dto.safety.GateLogResponse;
import com.society.backend.dto.safety.SOSAlertRequest;
import com.society.backend.dto.safety.SOSAlertResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface SafetyService {
    // SOS Alerts
    SOSAlertResponse createAlert(Long userId, SOSAlertRequest request);
    List<SOSAlertResponse> getAllAlerts(Long userId);
    List<SOSAlertResponse> getAlertsBySociety(Long societyId);
    List<SOSAlertResponse> getAlertsByStatus(Long societyId, String status);
    SOSAlertResponse getAlertById(Long id);
    SOSAlertResponse acknowledgeAlert(Long id, Long userId);
    SOSAlertResponse resolveAlert(Long id, Long userId, String resolutionNotes);
    SOSAlertResponse markFalseAlarm(Long id, Long userId);

    // Gate Logs
    GateLogResponse createGateLog(Long userId, GateLogRequest request);
    List<GateLogResponse> getGateLogsBySociety(Long societyId);
    List<GateLogResponse> getGateLogsByFlat(Long flatId);
    List<GateLogResponse> getGateLogsByDateRange(Long societyId, LocalDateTime start, LocalDateTime end);
    GateLogResponse getGateLogById(Long id);
    GateLogResponse markExit(Long id);
    void deleteGateLog(Long id);
}
