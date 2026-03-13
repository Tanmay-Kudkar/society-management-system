package com.society.backend.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_bill_id")
    private MaintenanceBill maintenanceBill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(nullable = false)
    private String status = "CREATED"; // CREATED, AUTHORIZED, CAPTURED, FAILED, CANCELLED, REFUNDED

    @Column(name = "payment_type")
    private String paymentType; // MAINTENANCE, VENDOR_BILL, OTHER

    @Column(name = "payment_method")
    private String paymentMethod; // card, upi, netbanking, wallet

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "receipt_number")
    private String receiptNumber;

    @Column(name = "error_code")
    private String errorCode;

    @Column(name = "error_description")
    private String errorDescription;

    @Column(name = "refund_id")
    private String refundId;

    @Column(name = "refund_status")
    private String refundStatus;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_initiated_at")
    private LocalDateTime refundInitiatedAt;

    @Column(name = "refund_processed_at")
    private LocalDateTime refundProcessedAt;

    @Column(name = "refund_failure_reason")
    private String refundFailureReason;

    @Column(name = "settlement_status")
    private String settlementStatus;

    @Column(name = "settlement_id")
    private String settlementId;

    @Column(name = "settlement_utr")
    private String settlementUtr;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
