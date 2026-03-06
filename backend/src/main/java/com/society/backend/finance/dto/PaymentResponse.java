package com.society.backend.finance.dto;

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
    private Long userId;
    private String userName;
    private Long societyId;
    private String societyName;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private String errorCode;
    private String errorDescription;
}
