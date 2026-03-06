package com.society.backend.security.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class SOSAlertResponse {
    private Long id;
    private String alertType;
    private String description;
    private Long raisedById;
    private String raisedByName;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private String societyName;
    private String status;
    private String priority;
    private String resolvedByName;
    private String resolutionNotes;
    private String location;
    private int escalationLevel;
    private LocalDateTime escalatedAt;
    private String acknowledgedByName;
    private Integer responseTimeSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
}
