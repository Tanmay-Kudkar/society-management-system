package com.society.backend.dto.workorder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class WorkOrderRequest {
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String category;
    private String priority;
    @NotNull
    private Long societyId;
    private Long assignedToId;
    private Long flatId;
    private String location;
    private BigDecimal estimatedCost;
    private LocalDate scheduledDate;
    private String notes;
}
