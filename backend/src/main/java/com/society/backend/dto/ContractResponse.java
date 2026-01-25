package com.society.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class ContractResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private Long vendorId;
    private String vendorName;
    private String contractType;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer reminderDays;
    private String documentUrl;
    private Boolean isActive;
    private Boolean isExpiringSoon;
    private Boolean isExpired;
    private Integer daysToExpiry;
    private LocalDateTime createdAt;
}
