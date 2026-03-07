package com.society.backend.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

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
    @JoinColumn(name = "maintenance_bill_id", nullable = false)
    private MaintenanceBill maintenanceBill;

    @Column(name = "charge_type", nullable = false, length = 64)
    private String chargeType;

    @Column(name = "description")
    private String description;

    @Column(name = "rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal rate = BigDecimal.ZERO;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "is_taxable", nullable = false)
    private Boolean isTaxable = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
}