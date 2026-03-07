package com.society.backend.finance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.society.backend.finance.entity.Payment;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.vendor.entity.Vendor;
@Getter
@Setter
public class TransactionRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Transaction type is required")
    private String transactionType; // INCOME, EXPENSE

    @NotBlank(message = "Payment mode is required")
    private String paymentMode; // CASH, CHEQUE, NEFT, UPI, CARD

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String category; // MAINTENANCE, VENDOR_PAYMENT, INTEREST, OTHER

    private String description;
    private LocalDate transactionDate;
    private String referenceNumber;

    // For cheque payments
    private String chequeNumber;
    private String bankName;
    private LocalDate chequeDate;

    // Related entity
    private Long relatedBillId;
    private String relatedBillType; // MAINTENANCE, VENDOR
    
    // For maintenance income - link to flat/unit
    private Long flatId; // Required for MAINTENANCE income transactions
}
