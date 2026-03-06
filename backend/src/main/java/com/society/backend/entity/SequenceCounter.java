package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tracks sequential counters for bill numbers and receipt numbers per society per financial year.
 * F13 — Sequential Receipt/Bill Numbers
 *
 * Bill number:    BILL-{societyId}-{FY}-{0001}   e.g. BILL-12-2026-0001
 * Receipt number: RCP-{societyId}-{FY}-{0001}    e.g. RCP-12-2026-0001
 */
@Entity
@Table(name = "sequence_counters",
        uniqueConstraints = @UniqueConstraint(columnNames = {"society_id", "counter_type", "financial_year"}))
@Getter
@Setter
@NoArgsConstructor
public class SequenceCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "society_id", nullable = false)
    private Long societyId;

    /**
     * Type of sequence counter.
     * Values: BILL, RECEIPT
     */
    @Column(name = "counter_type", nullable = false, length = 20)
    private String counterType;

    /** Financial year, e.g. 2026 (April 2026 – March 2027). */
    @Column(name = "financial_year", nullable = false)
    private Integer financialYear;

    /** Last issued sequence number. Starts at 0. */
    @Column(name = "current_value", nullable = false)
    private Long currentValue = 0L;
}
