package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "maintenance_bills")
@Getter
@Setter
@NoArgsConstructor
public class MaintenanceBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id", nullable = false)
    private Flat flat;

    @Column(name = "bill_month", nullable = false)
    private String billMonth; // e.g., "2026-01"

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    private String status = "UNPAID"; // UNPAID, PARTIAL, PAID

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_mode")
    private String paymentMode; // CASH, CHEQUE, ONLINE

    @Column(name = "receipt_number")
    private String receiptNumber;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // NEW METHODS FOR OVERDUE TRACKING
    @Transient
    public Boolean getIsOverdue() {
        if ("PAID".equals(status) || dueDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate);
    }

    @Transient
    public Long getOverdueDays() {
        if (!getIsOverdue()) {
            return 0L;
        }
        return ChronoUnit.DAYS.between(dueDate, LocalDate.now());
    }

    @Transient
    public BigDecimal getPendingAmount() {
        if (paidAmount == null) {
            return amount;
        }
        return amount.subtract(paidAmount);
    }

    @Transient
    public String getOverdueStatus() {
        if (!getIsOverdue()) {
            return "ON_TIME";
        }
        long days = getOverdueDays();
        if (days > 90) return "CRITICAL"; // 90+ days
        if (days > 60) return "SEVERE";   // 60-90 days
        if (days > 30) return "HIGH";     // 30-60 days
        return "OVERDUE";                  // 1-30 days
    }
}
