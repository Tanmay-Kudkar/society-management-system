package com.society.backend.dto.patrol;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class DutyRosterRequest {

    @NotNull(message = "Guard ID is required")
    private Long guardId;

    @NotBlank(message = "Shift name is required")
    private String shiftName;

    @NotNull(message = "Shift start time is required")
    private LocalTime shiftStart;

    @NotNull(message = "Shift end time is required")
    private LocalTime shiftEnd;

    @NotNull(message = "Duty date is required")
    private LocalDate dutyDate;

    private Long societyId;
    private String notes;
}
