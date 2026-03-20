package com.society.backend.finance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

import com.society.backend.user.entity.User;
@Data
public class CreateOrderRequest {
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
    
    private Long maintenanceBillId;

    private Long vendorBillId;
    
    private String paymentType = "MAINTENANCE"; // MAINTENANCE, VENDOR_BILL, OTHER
    
    private String description;
    
    @NotNull(message = "User ID is required")
    private Long userId;
}
