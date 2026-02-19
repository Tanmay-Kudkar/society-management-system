package com.society.backend.dto.approval;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalActionRequest {
    @NotBlank(message = "Action is required")
    private String action; // APPROVED, REJECTED, RETURNED, ESCALATED

    private String comments;
}
