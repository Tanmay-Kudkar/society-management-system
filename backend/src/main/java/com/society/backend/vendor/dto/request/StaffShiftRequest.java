package com.society.backend.vendor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class StaffShiftRequest {

    @NotNull
    private Long societyId;

    @NotNull
    private Long staffUserId;

    @NotNull
    private LocalDate shiftDate;

    @NotBlank
    private String shiftType;

    private String startTime;
    private String endTime;
    private String location;
    private String notes;
    private BigDecimal overtimeHours;
}
