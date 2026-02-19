package com.society.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class RenovationNocRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "Requested By user ID is required")
    private Long requestedById;

    private String flatNumber;
    private String wing;

    @NotBlank(message = "Renovation type is required")
    private String renovationType;

    private String description;
    private String contractorName;
    private String contractorPhone;
    private LocalDate estimatedStartDate;
    private LocalDate estimatedEndDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private BigDecimal estimatedCost;
    private BigDecimal depositAmount;
    private String depositStatus;
    private Boolean termsAccepted;
    private String adminNotes;
}
