package com.society.backend.dto.staff;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class StaffAttendanceRequest {

    @NotNull(message = "Staff ID is required")
    private Long staffId;

    private Long flatId;
    private Long societyId;
    private LocalDate attendanceDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private String notes;
}
