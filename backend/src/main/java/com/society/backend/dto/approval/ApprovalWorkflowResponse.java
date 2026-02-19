package com.society.backend.dto.approval;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ApprovalWorkflowResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String name;
    private String entityType;
    private String description;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Boolean isActive;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkflowStepResponse> steps;
}
