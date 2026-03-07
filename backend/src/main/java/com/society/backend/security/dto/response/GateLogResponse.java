package com.society.backend.security.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class GateLogResponse {
    private Long id;
    private String entryType;
    private String personName;
    private String personPhone;
    private String vehicleNumber;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private String societyName;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String entryGate;
    private String exitGate;
    private String purpose;
    private String status;
    private String notes;
    private String imageUrl;
    private Long visitorId;
    private String approvedByName;
    private String idType;
    private String idNumber;
    private String companyName;
    private String itemsCarried;
    private LocalDateTime createdAt;
}
