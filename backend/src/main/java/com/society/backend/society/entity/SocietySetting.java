package com.society.backend.society.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "society_settings")
@Getter
@Setter
@NoArgsConstructor
public class SocietySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false, unique = true)
    private Society society;

    @Column(name = "maintenance_rate_per_sqft", nullable = false, precision = 12, scale = 2)
    private BigDecimal maintenanceRatePerSqft = BigDecimal.ZERO;

    @Column(name = "water_charges_fixed", nullable = false, precision = 12, scale = 2)
    private BigDecimal waterChargesFixed = BigDecimal.ZERO;

    @Column(name = "water_charges_per_person", nullable = false, precision = 12, scale = 2)
    private BigDecimal waterChargesPerPerson = BigDecimal.ZERO;

    @Column(name = "sinking_fund_per_sqft", nullable = false, precision = 12, scale = 2)
    private BigDecimal sinkingFundPerSqft = BigDecimal.ZERO;

    @Column(name = "repair_fund_per_sqft", nullable = false, precision = 12, scale = 2)
    private BigDecimal repairFundPerSqft = BigDecimal.ZERO;

    @Column(name = "parking_charge_open", nullable = false, precision = 12, scale = 2)
    private BigDecimal parkingChargeOpen = BigDecimal.ZERO;

    @Column(name = "parking_charge_covered", nullable = false, precision = 12, scale = 2)
    private BigDecimal parkingChargeCovered = BigDecimal.ZERO;

    @Column(name = "parking_charge_stilt", nullable = false, precision = 12, scale = 2)
    private BigDecimal parkingChargeStilt = BigDecimal.ZERO;

    @Column(name = "parking_charge_two_wheeler", nullable = false, precision = 12, scale = 2)
    private BigDecimal parkingChargeTwoWheeler = BigDecimal.ZERO;

    @Column(name = "lift_maintenance_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal liftMaintenanceCharge = BigDecimal.ZERO;

    @Column(name = "electricity_common_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal electricityCommonCharge = BigDecimal.ZERO;

    @Column(name = "security_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal securityCharge = BigDecimal.ZERO;

    @Column(name = "insurance_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal insuranceCharge = BigDecimal.ZERO;

    @Column(name = "club_house_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal clubHouseCharge = BigDecimal.ZERO;

    @Column(name = "property_tax_share", nullable = false, precision = 12, scale = 2)
    private BigDecimal propertyTaxShare = BigDecimal.ZERO;

    @Column(name = "non_occupancy_surcharge_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal nonOccupancySurchargePct = BigDecimal.ZERO;

    @Column(name = "gst_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal gstPercentage = BigDecimal.ZERO;

    @Column(name = "late_payment_interest_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal latePaymentInterestPct = BigDecimal.ZERO;

    @Column(name = "grace_period_days", nullable = false)
    private Integer gracePeriodDays = 5;

    @Column(name = "penalty_fixed", nullable = false, precision = 12, scale = 2)
    private BigDecimal penaltyFixed = BigDecimal.ZERO;

    @Column(name = "bill_generation_day", nullable = false)
    private Integer billGenerationDay = 1;

    @Column(name = "due_date_day", nullable = false)
    private Integer dueDateDay = 10;

    @Column(name = "financial_year_start_month", nullable = false)
    private Integer financialYearStartMonth = 4;

    @Column(name = "bill_number_prefix", nullable = false, length = 20)
    private String billNumberPrefix = "BILL";

    @Column(name = "receipt_number_prefix", nullable = false, length = 20)
    private String receiptNumberPrefix = "RCT";

    @Column(name = "account_holder_name")
    private String accountHolderName;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "ifsc_code")
    private String ifscCode;

    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "payment_link")
    private String paymentLink;

    @Column(name = "committee_election_start_date")
    private LocalDate committeeElectionStartDate;

    @Column(name = "committee_election_end_date")
    private LocalDate committeeElectionEndDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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