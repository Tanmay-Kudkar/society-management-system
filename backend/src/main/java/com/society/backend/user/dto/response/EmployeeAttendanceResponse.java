package com.society.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class EmployeeAttendanceResponse {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private Long employeeUserId;
    private String employeeName;
    private Long societyId;
    private LocalDate attendanceDate;
    private String status;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String remarks;
    private Long markedById;
    private String markedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
