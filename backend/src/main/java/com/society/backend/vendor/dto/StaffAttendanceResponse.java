package com.society.backend.vendor.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class StaffAttendanceResponse {
    private Long id;
    private Long staffId;
    private String staffName;
    private String staffType;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private LocalDate attendanceDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
