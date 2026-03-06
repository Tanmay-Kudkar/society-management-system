package com.society.backend.security.service;

import com.society.backend.security.dto.GateLogRequest;
import com.society.backend.security.dto.GateLogResponse;
import com.society.backend.security.dto.SOSAlertRequest;
import com.society.backend.security.dto.SOSAlertResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface SafetyService {
    // SOS Alerts
    SOSAlertResponse createAlert(Long userId, SOSAlertRequest request);
    List<SOSAlertResponse> getAllAlerts(Long userId);
    List<SOSAlertResponse> getAlertsBySociety(Long societyId);
    List<SOSAlertResponse> getAlertsByStatus(Long societyId, String status);
    List<SOSAlertResponse> getAlertsByPriority(Long societyId, String priority);
    List<SOSAlertResponse> getActiveAndAcknowledgedAlerts(Long societyId);
    Map<String, Long> getAlertCounts(Long societyId);
    SOSAlertResponse getAlertById(Long id);
    SOSAlertResponse acknowledgeAlert(Long id, Long userId);
    SOSAlertResponse resolveAlert(Long id, Long userId, String resolutionNotes);
    SOSAlertResponse markFalseAlarm(Long id, Long userId);
    SOSAlertResponse escalateAlert(Long id, Long userId);

    // Gate Logs
    GateLogResponse createGateLog(Long userId, GateLogRequest request);
    List<GateLogResponse> getGateLogsBySociety(Long societyId);
    List<GateLogResponse> getGateLogsByFlat(Long flatId);
    List<GateLogResponse> getGateLogsByDateRange(Long societyId, LocalDateTime start, LocalDateTime end);
    List<GateLogResponse> getGateLogsByEntryType(Long societyId, String entryType);
    List<GateLogResponse> getGateLogsByStatus(Long societyId, String status);
    GateLogResponse getGateLogById(Long id);
    GateLogResponse markExit(Long id);
    void deleteGateLog(Long id);
}
