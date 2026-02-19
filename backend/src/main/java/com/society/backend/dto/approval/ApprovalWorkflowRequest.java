package com.society.backend.dto.approval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ApprovalWorkflowRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    private String description;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Boolean isActive = true;
    private List<WorkflowStepRequest> steps;
}
