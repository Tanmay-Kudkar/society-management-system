package com.society.backend.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class VisitorRequest {

    @NotBlank(message = "Visitor name is required")
    private String visitorName;

    private String visitorPhone;

    @NotBlank(message = "Visitor type is required")
    private String visitorType;

    private String purpose;
    private Long flatId;
    private Long societyId;
    private String vehicleNumber;
    private LocalDateTime expectedArrival;
    private Boolean isPreApproved;
    private String notes;
}
