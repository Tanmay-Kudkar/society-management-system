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
@Table(name = "renovation_nocs")
@Getter
@Setter
@NoArgsConstructor
public class RenovationNoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(length = 50)
    private String flatNumber;

    @Column(length = 50)
    private String wing;

    @Column(nullable = false, length = 50)
    private String renovationType = "INTERIOR";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String contractorName;

    @Column(length = 20)
    private String contractorPhone;

    private LocalDate estimatedStartDate;
    private LocalDate estimatedEndDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    @Column(precision = 12, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(length = 20)
    private String depositStatus = "UNPAID";

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private Boolean termsAccepted = false;

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
