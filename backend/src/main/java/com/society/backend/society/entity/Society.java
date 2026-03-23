package com.society.backend.society.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "societies")
@Getter
@Setter
@NoArgsConstructor
public class Society {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;

    private String state;

    private String pincode;

    @Column(name = "registration_number")
    private String registrationNumber;

    private String email;

    private String telephone;

    @Column(name = "exact_latitude")
    private Double exactLatitude;

    @Column(name = "exact_longitude")
    private Double exactLongitude;

    // Total capacity for units (for planning/display purposes)
    @Column(name = "total_flats")
    private Integer totalFlats = 0;

    @Column(name = "total_shops")
    private Integer totalShops = 0;

    @Column(name = "total_offices")
    private Integer totalOffices = 0;

    @Column(name = "total_wings")
    private Integer totalWings = 0;

    @Column(name = "total_floors")
    private Integer totalFloors = 1;

    @Column(name = "has_wings")
    private Boolean hasWings = true;

    @Column(name = "two_wheeler_parking_capacity")
    private Integer twoWheelerParkingCapacity;

    @Column(name = "four_wheeler_parking_capacity")
    private Integer fourWheelerParkingCapacity;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (hasWings == null) {
            hasWings = true;
        }
        if (totalFloors == null || totalFloors < 1) {
            totalFloors = 1;
        }
    }
}
