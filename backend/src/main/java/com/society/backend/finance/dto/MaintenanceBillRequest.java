package com.society.backend.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class MaintenanceBillRequest {
    @NotNull(message = "Flat ID is required")
    private Long flatId;

    @NotBlank(message = "Bill month is required")
    private String billMonth; // Format: YYYY-MM

    // Optional in itemized mode (calculated from line items)
    private BigDecimal amount;

    private List<BillLineItemRequest> lineItems;

    private LocalDate dueDate;
    private BigDecimal paidAmount;
    private String paymentMode;
    private String referenceNumber;
}

