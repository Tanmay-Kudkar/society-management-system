package com.society.backend.finance.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class TransactionResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String transactionType;
    private String paymentMode;
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDate transactionDate;
    private String referenceNumber;
    private String chequeNumber;
    private String bankName;
    private LocalDate chequeDate;
    private Long relatedBillId;
    private String relatedBillType;
    private Long flatId;
    private String flatNumber; // For display
    private LocalDateTime createdAt;
}
