package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "common_area_schedules")
@Getter
@Setter
@NoArgsConstructor
public class CommonAreaSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(nullable = false, length = 200)
    private String areaName;

    @Column(nullable = false, length = 50)
    private String areaType = "OTHER";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String maintenanceType = "CLEANING";

    @Column(nullable = false, length = 30)
    private String frequency = "DAILY";

    @Column(length = 20)
    private String dayOfWeek;

    private Integer dayOfMonth;

    @Column(length = 50)
    private String timeSlot;

    @Column(length = 200)
    private String assignedTo;

    @Column(length = 200)
    private String vendorName;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    private LocalDateTime lastCompletedAt;

    private LocalDate nextDueDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal costPerService;

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
