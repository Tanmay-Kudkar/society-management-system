package com.society.backend.society.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CommonAreaScheduleRequest {

    @NotNull
    private Long societyId;

    @NotBlank
    private String areaName;

    @NotBlank
    private String areaType;

    private String description;

    @NotBlank
    private String maintenanceType;

    private String frequency = "DAILY";
    private String dayOfWeek;
    private Integer dayOfMonth;
    private String timeSlot;
    private String assignedTo;
    private String vendorName;
    private LocalDate nextDueDate;
    private BigDecimal costPerService;
    private String notes;
}
