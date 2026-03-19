package com.society.backend.user.entity;

import com.society.backend.society.entity.Society;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_salary_payments", indexes = {
        @Index(name = "idx_emp_salary_society_month", columnList = "society_id, salary_month"),
        @Index(name = "idx_emp_salary_employee_month", columnList = "employee_id, salary_month"),
        @Index(name = "idx_emp_salary_paid_at", columnList = "paid_at")
})
@Getter
@Setter
@NoArgsConstructor
public class EmployeeSalaryPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(name = "salary_month", nullable = false)
    private LocalDate salaryMonth;

    @Column(name = "base_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "deduction_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal deductionAmount = BigDecimal.ZERO;

    @Column(name = "net_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal netPaid;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "payment_mode", length = 30)
    private String paymentMode;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "deduction_reason", columnDefinition = "TEXT")
    private String deductionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
