package com.society.backend.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class MaintenanceBillResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private String ownerName;
    private Long societyId;
    private String societyName;
    private String billMonth;
    private String billNumber;
    private BigDecimal amount;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal interestAmount;
    private BigDecimal penaltyAmount;
    private BigDecimal totalAmount;
    private BigDecimal previousBalance;
    private BigDecimal advanceBalance;
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
    private List<BillLineItemResponse> lineItems;
}
