package com.society.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class MaintenanceBillResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private String ownerName;
    private String billMonth;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private String status;
    private String paymentMode;
    private String receiptNumber;
    private String referenceNumber;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
