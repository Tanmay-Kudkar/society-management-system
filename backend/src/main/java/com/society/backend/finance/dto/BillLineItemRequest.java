package com.society.backend.finance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BillLineItemRequest {
    @NotBlank(message = "Charge type is required")
    private String chargeType;

    private String description;
    private BigDecimal rate;
    private BigDecimal quantity;
    private BigDecimal amount;
    private Boolean isTaxable;
    private Integer displayOrder;
}