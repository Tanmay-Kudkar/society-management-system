package com.society.backend.society.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.society.backend.user.entity.User;
@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(nullable = false, length = 200)
    private String assetName;

    @Column(length = 50)
    private String assetCode;

    @Column(nullable = false, length = 50)
    private String category = "OTHER";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String location;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE";

    @Column(name = "\"condition\"", nullable = false, length = 30)
    private String condition = "GOOD";

    private LocalDate purchaseDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal purchaseCost;

    @Column(precision = 12, scale = 2)
    private BigDecimal currentValue;

    private LocalDate warrantyExpiry;

    @Column(length = 200)
    private String vendorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(nullable = false)
    private Integer quantity = 1;

    private Integer minQuantity = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
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
