package com.society.backend.dto.maintenance;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class MaintenanceBillResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private String ownerName;
    private String societyName;
    private String billMonth;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private String status;
    private String paymentMode;
    private String receiptNumber;
    private String referenceNumber;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
