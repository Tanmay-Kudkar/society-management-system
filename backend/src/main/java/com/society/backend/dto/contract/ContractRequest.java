package com.society.backend.dto.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ContractRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "Vendor is required")
    private Long vendorId;

    @NotBlank(message = "Contract type is required")
    private String contractType; // AMC, INSURANCE, PEST_CONTROL, FD, LEAVE_LICENSE, etc.

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Reminder days is required")
    private Integer reminderDays; // Days before expiry to send reminder

    private String documentUrl;
}
