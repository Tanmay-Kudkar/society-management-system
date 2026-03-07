package com.society.backend.flat.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class FacilityBookingResponse {

    private Long id;
    private Long societyId;
    private Long bookedById;
    private String bookedByName;
    private String facilityName;
    private String facilityType;
    private LocalDate bookingDate;
    private String startTime;
    private String endTime;
    private String purpose;
    private Integer attendees;
    private String status;
    private BigDecimal amount;
    private String paymentStatus;
    private String adminNotes;
    private String cancelledReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
