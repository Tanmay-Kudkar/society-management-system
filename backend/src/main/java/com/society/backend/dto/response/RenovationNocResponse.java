package com.society.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class RenovationNocResponse {

    private Long id;
    private Long societyId;
    private Long requestedById;
    private String requestedByName;
    private String flatNumber;
    private String wing;
    private String renovationType;
    private String description;
    private String contractorName;
    private String contractorPhone;
    private LocalDate estimatedStartDate;
    private LocalDate estimatedEndDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private BigDecimal estimatedCost;
    private BigDecimal depositAmount;
    private String depositStatus;
    private String status;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private Boolean termsAccepted;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
