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
@Table(name = "vendor_bills")
@Getter
@Setter
@NoArgsConstructor
public class VendorBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Transient
    private Organization organization;

    @Column(name = "bill_number")
    private String billNumber;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "bill_date", nullable = false)
    private LocalDate billDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, PARTIAL, PAID

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "payment_mode")
    private String paymentMode;

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

    // ------------------ CALCULATED FIELDS ------------------

    public Long getPendingDays() {
        if (dueDate == null || "PAID".equals(status)) {
            return 0L;
        }
        long days = ChronoUnit.DAYS.between(dueDate, LocalDate.now());
        return Math.max(days, 0);
    }

    @Transient
    public Boolean getIsOverdue() {
        if ("PAID".equals(status) || dueDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate);
    }

    @Transient
    public Long getOverdueDays() {
        return getPendingDays();
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
        if (days > 90) return "CRITICAL";
        if (days > 60) return "SEVERE";
        if (days > 30) return "HIGH";
        return "OVERDUE";
    }
}
