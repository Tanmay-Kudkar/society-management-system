package com.society.backend.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // INCOME, EXPENSE

    @Column(name = "payment_mode", nullable = false)
    private String paymentMode; // CASH, CHEQUE, ONLINE

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String category; // MAINTENANCE, VENDOR_PAYMENT, AMC, SALARY, etc.

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_number")
    private String referenceNumber; // cheque number, transaction id

    @Column(name = "cheque_number")
    private String chequeNumber;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "cheque_date")
    private LocalDate chequeDate;

    // UPI fields
    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "utr_number")
    private String utrNumber; // Unified Transaction Reference / Transaction ID

    // Card fields
    @Column(name = "card_type")
    private String cardType; // CREDIT, DEBIT

    @Column(name = "card_last_four_digits", length = 4)
    private String cardLastFourDigits;

    // Accounting fields
    @Column(name = "payment_month", length = 7)
    private String paymentMonth; // YYYY-MM for maintenance

    @Column(name = "late_fee")
    private BigDecimal lateFee;

    @Column(name = "discount")
    private BigDecimal discount;

    @Column(name = "tax_amount")
    private BigDecimal taxAmount;

    @Column(name = "receipt_number")
    private String receiptNumber;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "related_bill_id")
    private Long relatedBillId;

    @Column(name = "related_bill_type")
    private String relatedBillType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat; // For maintenance income, links to the unit/flat

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
