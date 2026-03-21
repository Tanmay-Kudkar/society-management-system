package com.society.backend.finance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    
    private Long id;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String paymentType;
    private String paymentMethod;
    private String description;
    private String receiptNumber;
    private Long maintenanceBillId;
    private Long vendorBillId;
    private Long userId;
    private String userName;
    private Long societyId;
    private String societyName;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime deletedAt;
    private LocalDateTime undoExpiresAt;
    private Boolean undoAvailable;
    private String errorCode;
    private String errorDescription;
    private String refundId;
    private String refundStatus;
    private BigDecimal refundAmount;
    private LocalDateTime refundInitiatedAt;
    private LocalDateTime refundProcessedAt;
    private String refundFailureReason;
    private String settlementStatus;
    private String settlementId;
    private String settlementUtr;
    private LocalDateTime settledAt;
}
