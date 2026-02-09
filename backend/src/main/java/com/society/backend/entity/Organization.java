package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

//  Organization entity for multi-society management.
//  An Organization Owner manages multiple societies through this entity.
//  Supports subscription-based access with free lifetime option for founding clients.
//  Founding members get lifetime access with unlimited societies.

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "owner_email", unique = true)
    private String ownerEmail;

    @Column(name = "owner_phone")
    private String ownerPhone;

    @Column(name = "subscription_type")
    private String subscriptionType = "FREE"; // FREE, BASIC, PREMIUM, LIFETIME

    @Column(name = "subscription_status")
    private String subscriptionStatus = "ACTIVE"; // ACTIVE, EXPIRED, SUSPENDED, CANCELLED

    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;

    @Column(name = "subscription_end_date")
    private LocalDate subscriptionEndDate;

    @Column(name = "max_societies")
    private Integer maxSocieties = 1;

    @Column(name = "is_founding_member")
    private Boolean isFoundingMember = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (subscriptionStartDate == null) {
            subscriptionStartDate = LocalDate.now();
        }
    }

    // Check if the organization can create more societies
   
    public boolean canCreateMoreSocieties(long currentSocietyCount) {
        if (isFoundingMember != null && isFoundingMember) {
            return true; // Founding members have unlimited societies
        }
        return currentSocietyCount < maxSocieties;
    }

 
    // Check if subscription is active
   
    public boolean isSubscriptionActive() {
        if ("LIFETIME".equals(subscriptionType) || (isFoundingMember != null && isFoundingMember)) {
            return true;
        }
        if (!"ACTIVE".equals(subscriptionStatus)) {
            return false;
        }
        if (subscriptionEndDate != null && LocalDate.now().isAfter(subscriptionEndDate)) {
            return false;
        }
        return true;
    }
}
