package com.society.backend.dto.approval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ApprovalRequestCreateDTO {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotNull(message = "Entity ID is required")
    private Long entityId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private BigDecimal amount;
    private String metadata;
}
