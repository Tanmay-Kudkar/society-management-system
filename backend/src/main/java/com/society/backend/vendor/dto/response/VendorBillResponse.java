package com.society.backend.vendor.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class VendorBillResponse {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private Long societyId;
    private String societyName;
    private String billNumber;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private String status;
    private LocalDate billDate;
    private LocalDate dueDate;
    private Integer pendingDays;
    private String description;
    private String paymentMode;
    private String referenceNumber;
    private String receivedByRole;
    private String receivedByName;
    private String paymentNotes;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
