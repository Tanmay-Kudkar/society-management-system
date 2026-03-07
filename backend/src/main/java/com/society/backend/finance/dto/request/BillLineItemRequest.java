package com.society.backend.finance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request DTO for creating/updating a bill line item.
 */
@Getter
@Setter
public class BillLineItemRequest {

    @NotBlank(message = "Charge type is required")
    private String chargeType;

    @NotBlank(message = "Description is required")
    private String description;

    @Positive(message = "Unit price must be positive")
    private BigDecimal unitPrice;

    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
}
