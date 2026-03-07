package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ApprovalRequestResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private Long workflowId;
    private String workflowName;
    private String entityType;
    private Long entityId;
    private String title;
    private String description;
    private BigDecimal amount;
    private String status;
    private Integer currentStep;
    private Integer totalSteps;
    private Long requestedBy;
    private String requestedByName;
    private Long finalApprover;
    private String finalApproverName;
    private String rejectionReason;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ApprovalActionResponse> actions;
}
