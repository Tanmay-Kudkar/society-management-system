package com.society.backend.auth.dto.response;

import com.society.backend.auth.entity.LoginAudit;

import java.time.format.DateTimeFormatter;

public class LoginAuditResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String action;
    private String timestamp;
    private String ipAddress;
    private String userAgent;
    private Double latitude;
    private Double longitude;
    private Boolean isNearby;
    private Double distanceMeters;
    private Double proximityThresholdMeters;
    private String proximityReason;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private Boolean usedFallbackLocation;

    public LoginAuditResponse() {}

    public static LoginAuditResponse from(LoginAudit audit) {
        LoginAuditResponse dto = new LoginAuditResponse();
        dto.id = audit.getId();
        dto.action = audit.getAction() != null ? audit.getAction().name() : null;
        dto.timestamp = audit.getTimestamp() != null ? audit.getTimestamp().format(FORMATTER) : null;
        dto.ipAddress = audit.getIpAddress();
        dto.userAgent = audit.getUserAgent();
        dto.latitude = audit.getLatitude();
        dto.longitude = audit.getLongitude();
        dto.isNearby = audit.getIsNearby();
        dto.usedFallbackLocation = audit.getUsedFallbackLocation();
        dto.distanceMeters = audit.getDistanceMeters();
        dto.proximityThresholdMeters = audit.getProximityThresholdMeters();
        dto.proximityReason = resolveProximityReason(audit);
        if (audit.getUser() != null) {
            dto.userId = audit.getUser().getId();
            dto.userName = audit.getUser().getName();
            dto.userEmail = audit.getUser().getEmail();
        }
        return dto;
    }

    private static String resolveProximityReason(LoginAudit audit) {
        if (Boolean.TRUE.equals(audit.getUsedFallbackLocation())) {
            return "Used last known location (GPS was unavailable during logout)";
        }

        if (audit.getLatitude() == null || audit.getLongitude() == null) {
            return "Location not shared by the device";
        }

        if (audit.getIsNearby() != null) {
            return null;
        }

        if (audit.getDistanceMeters() == null && audit.getProximityThresholdMeters() != null) {
            return "First login baseline created; compare starts from next login";
        }

        if (audit.getDistanceMeters() == null) {
            return "Distance unavailable for proximity comparison";
        }

        return "Proximity could not be determined";
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
    public String getAction() { return action; }
    public String getTimestamp() { return timestamp; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Boolean getIsNearby() { return isNearby; }
    public Double getDistanceMeters() { return distanceMeters; }
    public Double getProximityThresholdMeters() { return proximityThresholdMeters; }
    public Boolean getUsedFallbackLocation() { return usedFallbackLocation; }
    public String getProximityReason() { return proximityReason; }
}
