package com.society.backend.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a single charge line on a MaintenanceBill.
 * F09 — Itemized Bill Line Items
 *
 * Examples:
 *   - Maintenance Charge:  ₹2000
 *   - Water Charge:        ₹500
 *   - Parking:             ₹300
 *   - Sinking Fund:        ₹200
 *   - Club House:          ₹100
 */
@Entity
@Table(name = "bill_line_items")
@Getter
@Setter
@NoArgsConstructor
public class BillLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private MaintenanceBill bill;

    /**
     * Charge type key — matches a SocietyRateConfig chargeType or CUSTOM.
     * E.g. MAINTENANCE, WATER, PARKING, SINKING_FUND, CLUB_HOUSE,
     *      COMMON_ELECTRICITY, SECURITY, LIFT, GARBAGE, GARDEN, CUSTOM
     */
    @Column(name = "charge_type", nullable = false, length = 50)
    private String chargeType;

    @Column(nullable = false, length = 200)
    private String description;

    /** Unit price (rate per unit / per sqft). Null if not applicable. */
    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice;

    /** Quantity (e.g., area in sqft). Default 1. */
    @Column(precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    /** Final line amount = unitPrice * quantity (or directly set for flat rates). */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (quantity == null) quantity = BigDecimal.ONE;
    }
}
