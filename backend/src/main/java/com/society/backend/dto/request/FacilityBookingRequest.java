package com.society.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class FacilityBookingRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "Booked By user ID is required")
    private Long bookedById;

    @NotBlank(message = "Facility name is required")
    private String facilityName;

    @NotBlank(message = "Facility type is required")
    private String facilityType;

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotBlank(message = "Start time is required")
    private String startTime;

    @NotBlank(message = "End time is required")
    private String endTime;

    private String purpose;
    private Integer attendees;
    private BigDecimal amount;
    private String paymentStatus;
    private String adminNotes;
    private String cancelledReason;
}
