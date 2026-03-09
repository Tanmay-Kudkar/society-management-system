package com.society.backend.security.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class VisitorResponse {
    private Long id;
    private String visitorName;
    private String visitorPhone;
    private String visitorType;
    private String purpose;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private String societyName;
    private String vehicleNumber;
    private LocalDateTime expectedArrival;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private Boolean isPreApproved;
    private String approvalCode;
    private LocalDateTime otpExpiresAt;
    private LocalDateTime otpVerifiedAt;
    private Integer otpAttempts;
    private String approvedByName;
    private String notes;
    private LocalDateTime createdAt;
}
