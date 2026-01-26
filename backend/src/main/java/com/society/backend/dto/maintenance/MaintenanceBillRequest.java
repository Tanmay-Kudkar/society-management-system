package com.society.backend.dto.maintenance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MaintenanceBillRequest {
    @NotNull(message = "Flat ID is required")
    private Long flatId;

    @NotBlank(message = "Bill month is required")
    private String billMonth; // Format: YYYY-MM

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private BigDecimal paidAmount;
    private String paymentMode;
    private String referenceNumber;
}
