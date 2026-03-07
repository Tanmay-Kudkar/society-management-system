package com.society.backend.finance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderResponse {
    
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String keyId;
    private String receipt;
    private String description;
    private Long paymentId;
    
    // Prefill data for checkout
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
