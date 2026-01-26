package com.society.backend.dto.vendor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class VendorBillRequest {
    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    @NotNull(message = "Society ID is required")
    private Long societyId;

    private String billNumber;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private BigDecimal paidAmount;

    private LocalDate billDate;
    private LocalDate dueDate;

    private String description;
    private String paymentMode;
    private String referenceNumber;
}
