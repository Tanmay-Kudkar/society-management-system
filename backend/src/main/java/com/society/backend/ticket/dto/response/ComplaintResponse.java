package com.society.backend.ticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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
    private String status;
    private String resolution;
    private LocalDateTime createdAt;
    private Boolean deleted;
    private String statusUndoPreviousStatus;
    private String statusUndoPreviousResolution;
    private String statusUndoExpiresAt;
    private String deleteUndoPreviousStatus;
    private String deleteUndoPreviousResolution;
    private String deleteUndoExpiresAt;
}
