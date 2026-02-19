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
public class CommonAreaScheduleResponse {
    private Long id;
    private Long societyId;
    private String areaName;
    private String areaType;
    private String description;
    private String maintenanceType;
    private String frequency;
    private String dayOfWeek;
    private Integer dayOfMonth;
    private String timeSlot;
    private String assignedTo;
    private String vendorName;
    private String status;
    private LocalDateTime lastCompletedAt;
    private LocalDate nextDueDate;
    private BigDecimal costPerService;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
