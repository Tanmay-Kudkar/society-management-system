package com.society.backend.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BillLineItemResponse {
    private Long id;
    private String chargeType;
    private String description;
    private BigDecimal rate;
    private BigDecimal quantity;
    private BigDecimal amount;
    private Boolean isTaxable;
    private Integer displayOrder;
}