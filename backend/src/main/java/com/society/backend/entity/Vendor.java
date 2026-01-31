package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society; // null means common/partner vendor

    @Column(nullable = false)
    private String name;

    @Column(name = "service_type", nullable = false)
    private String serviceType; // PLUMBER, ELECTRICIAN, SECURITY, HOUSEKEEPING, etc.

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "contact_person_phone")
    private String contactPersonPhone;

    @Column(name = "contact_person_email")
    private String contactPersonEmail;

    @Column
    private String phone;

    @Column
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "ifsc_code")
    private String ifscCode;

    @Column(name = "is_common")
    private Boolean isCommon = false; // true = available to all societies

    @Column(name = "approval_status")
    private String approvalStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
