package com.society.backend.ticket.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WorkflowStepResponse {
    private Long id;
    private Integer stepOrder;
    private String approverRole;
    private Boolean isMandatory;
    private BigDecimal autoApproveBelow;
}
