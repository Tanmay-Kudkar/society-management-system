package com.society.backend.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for a single bill line item.
 */
@Getter
@Setter
public class BillLineItemResponse {
    private Long id;
    private Long billId;
    private String chargeType;
    private String description;
    private BigDecimal unitPrice;
    private BigDecimal quantity;
    private BigDecimal amount;
    private LocalDateTime createdAt;
}
