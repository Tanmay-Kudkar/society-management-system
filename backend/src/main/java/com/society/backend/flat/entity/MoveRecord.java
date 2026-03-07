package com.society.backend.flat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Entity
@Table(name = "move_records")
@Getter
@Setter
@NoArgsConstructor

public class MoveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    private String flatNumber;

    @Column(length = 50)
    private String wing;

    @Column(nullable = false, length = 20)
    private String moveType = "MOVE_IN";

    @Column(nullable = false)
    private LocalDate moveDate;

    @Column(length = 20)
    private String scheduledTime;

    @Column(length = 20)
    private String actualTime;

    @Column(length = 30)
    private String vehicleNumber;

    @Column(length = 30)
    private String vehicleType;

    @Column(length = 200)
    private String moversCompany;

    @Column(length = 20)
    private String moversPhone;

    private Integer numberOfHelpers = 0;

    @Column(columnDefinition = "TEXT")
    private String itemsDescription;

    private Boolean elevatorRequired = false;

    @Column(precision = 12, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(length = 20)
    private String depositStatus = "UNPAID";

    @Column(nullable = false, length = 30)
    private String status = "SCHEDULED";

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private Boolean inspectionDone = false;

    @Column(columnDefinition = "TEXT")
    private String damageReported;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
