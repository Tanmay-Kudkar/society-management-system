package com.society.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class EmployeeAttendanceRequest {

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotBlank(message = "Attendance status is required")
    private String status;

    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String remarks;
}
