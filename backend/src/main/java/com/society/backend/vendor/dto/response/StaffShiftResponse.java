package com.society.backend.vendor.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class StaffShiftResponse {
    private Long id;
    private Long societyId;
    private Long staffUserId;
    private String staffUserName;
    private LocalDate shiftDate;
    private String shiftType;
    private String startTime;
    private String endTime;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private String location;
    private String notes;
    private BigDecimal overtimeHours;
    private LocalDateTime createdAt;
}
