package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

import com.society.backend.user.entity.Role;
@Getter
@Setter
public class WorkflowStepRequest {
    @NotNull(message = "Step order is required")
    private Integer stepOrder;

    @NotBlank(message = "Approver role is required")
    private String approverRole;

    private Boolean isMandatory = true;
    private BigDecimal autoApproveBelow;
}
