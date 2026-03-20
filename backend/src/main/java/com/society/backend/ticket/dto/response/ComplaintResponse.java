package com.society.backend.ticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ComplaintResponse {
    private Long id;
    private String complaintNumber;
    private Long userId;
    private String raisedByName;
    private Long societyId;
    private String societyName;
    private String subject;
    private String description;
    private String category;
    private String priority;
    private String wing;
    private Integer floor;
    private String flatNumber;
    private String locationDetails;
    private List<String> attachmentUrls;
    private Long assignedToUserId;
    private String assignedToName;
    private Long raisedForUserId;
    private String raisedForName;
    private String raisedForReason;
    private String adminRemarks;
    private String status;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime slaDueAt;
    private Long slaRemainingMinutes;
    private Boolean slaBreached;
    private Long breachDurationMinutes;
    private String escalationLevel;
    private Boolean deleted;
    private String statusUndoPreviousStatus;
    private String statusUndoPreviousResolution;
    private String statusUndoExpiresAt;
    private String deleteUndoPreviousStatus;
    private String deleteUndoPreviousResolution;
    private String deleteUndoExpiresAt;
}
