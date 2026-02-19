package com.society.backend.dto.patrol;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class DutyRosterResponse {
    private Long id;
    private Long societyId;
    private Long guardId;
    private String guardName;
    private String shiftName;
    private LocalTime shiftStart;
    private LocalTime shiftEnd;
    private LocalDate dutyDate;
    private String status;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String notes;
    private LocalDateTime createdAt;
}
