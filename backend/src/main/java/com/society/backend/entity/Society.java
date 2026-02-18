package com.society.backend.entity;

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

    /**
     * Organization this society belongs to.
     * - null if created by a standalone SocietyAdmin
     * - linked to Organization if created by an Organization Owner
     */
    @Transient
    private Organization organization;

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

    // Total capacity for units (for planning/display purposes)
    @Column(name = "total_flats")
    private Integer totalFlats = 0;

    @Column(name = "total_shops")
    private Integer totalShops = 0;

    @Column(name = "total_offices")
    private Integer totalOffices = 0;

    @Column(name = "total_wings")
    private Integer totalWings = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
