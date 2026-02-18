package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "gate_logs")
@Getter
@Setter
@NoArgsConstructor
public class GateLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_type", nullable = false)
    private String entryType; // RESIDENT, VISITOR, STAFF, DELIVERY, CAB, VEHICLE

    @Column(name = "person_name", nullable = false)
    private String personName;

    @Column(name = "person_phone")
    private String personPhone;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "entry_gate")
    private String entryGate;

    @Column(name = "exit_gate")
    private String exitGate;

    @Column
    private String purpose;

    @Column(nullable = false)
    private String status = "IN"; // IN, OUT

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
