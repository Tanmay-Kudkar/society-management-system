package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stores the default charge rates for a society.
 * F08 — Society Rate Configuration
 *
 * Admin defines: Maintenance = ₹2/sqft, Water = flat ₹500, Parking = ₹300/slot…
 * These rates are applied when generating bills with itemized line items.
 */
@Entity
@Table(name = "society_rate_configs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"society_id", "charge_type", "applicable_to"}))
@Getter
@Setter
@NoArgsConstructor
public class SocietyRateConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    /**
     * Matches BillLineItem.chargeType.
     * E.g. MAINTENANCE, WATER, PARKING, SINKING_FUND, CLUB_HOUSE,
     *      COMMON_ELECTRICITY, SECURITY, LIFT, GARBAGE, GARDEN
     */
    @Column(name = "charge_type", nullable = false, length = 50)
    private String chargeType;

    @Column(nullable = false, length = 200)
    private String description;

    /** Base rate amount (per sqft if isPerSqft=true, otherwise flat amount per unit). */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * Which unit type this rate applies to.
     * Values: ALL, FLAT, SHOP, OFFICE
     */
    @Column(name = "applicable_to", length = 20)
    private String applicableTo = "ALL";

    /**
     * If true, amount is multiplied by flat area (sqft) when generating line items.
     * E.g. maintenance @ ₹2/sqft × 800sqft = ₹1600
     */
    @Column(name = "is_per_sqft")
    private Boolean isPerSqft = false;

    /** Controls ordering in the generated bill. */
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
