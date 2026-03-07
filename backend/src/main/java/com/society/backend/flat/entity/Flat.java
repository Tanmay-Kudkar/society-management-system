package com.society.backend.flat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Entity
@Table(name = "flats")
@Getter
@Setter
@NoArgsConstructor
public class Flat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wing_id")
    private Wing wing;

    @Column(name = "flat_number", nullable = false)
    private String flatNumber;

    // Unit type: FLAT, SHOP, OFFICE
    @Column(name = "unit_type")
    private String unitType = "FLAT";

    @Column(name = "flat_type")
    private String flatType; // 1BHK, 2BHK, 3BHK, STUDIO, PENTHOUSE, etc.

    @Column
    private Integer floor;

    @Column
    private BigDecimal area; // in sq ft

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Column(name = "owner_phone")
    private String ownerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User owner;

    @Column(name = "is_occupied")
    private Boolean isOccupied = false;
}
