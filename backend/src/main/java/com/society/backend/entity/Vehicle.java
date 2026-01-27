package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id", nullable = false)
    private Flat flat;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType; // TWO_WHEELER, FOUR_WHEELER

    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;

    @Column
    private String brand;

    @Column
    private String model;

    @Column
    private String color;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "parking_slot")
    private String parkingSlot;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}
