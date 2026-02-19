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

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_id")
    private Visitor visitor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "id_type")
    private String idType; // AADHAAR, PAN, DRIVING_LICENSE, PASSPORT, OTHER

    @Column(name = "id_number")
    private String idNumber;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "items_carried", columnDefinition = "TEXT")
    private String itemsCarried;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
