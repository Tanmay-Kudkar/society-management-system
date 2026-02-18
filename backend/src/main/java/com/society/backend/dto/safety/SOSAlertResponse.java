package com.society.backend.dto.safety;

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
    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
}
