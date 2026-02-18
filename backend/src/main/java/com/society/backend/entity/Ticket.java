package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raised_by", nullable = false)
    private User raisedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Transient
    private Organization organization;

    @Column(nullable = false)
    private String type; // COMPLAINT, REQUEST, ISSUE

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED

    @Column
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "progress_percent")
    private Integer progressPercent = 0; // 0-100

    // NEW FIELDS FOR OVERDUE TRACKING
    @Column(name = "is_overdue")
    private Boolean isOverdue = false;

    @Column(name = "overdue_days")
    private Integer overdueDays = 0;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0; // 0: Normal, 1: First escalation, 2: Second escalation

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public Integer getPendingDays() {
        if (resolvedAt != null || "RESOLVED".equals(status) || "CLOSED".equals(status)) {
            return 0;
        }
        return (int) java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(), java.time.LocalDate.now());
    }

    // NEW METHOD: Check if ticket is overdue
    public void updateOverdueStatus() {
        if ("RESOLVED".equals(status) || "CLOSED".equals(status) || "REJECTED".equals(status)) {
            this.isOverdue = false;
            this.overdueDays = 0;
            this.escalationLevel = 0;
            return;
        }

        int pendingDays = getPendingDays();
        
        // Define overdue thresholds based on priority
        int overdueThreshold = switch (priority) {
            case "URGENT" -> 1;  // 1 day for urgent
            case "HIGH" -> 3;    // 3 days for high
            case "MEDIUM" -> 7;  // 7 days for medium
            case "LOW" -> 14;    // 14 days for low
            default -> 7;
        };

        this.isOverdue = pendingDays > overdueThreshold;
        this.overdueDays = Math.max(0, pendingDays - overdueThreshold);

        // Calculate escalation level
        if (this.isOverdue) {
            if (pendingDays > overdueThreshold * 3) {
                this.escalationLevel = 2; // Critical escalation
            } else if (pendingDays > overdueThreshold * 2) {
                this.escalationLevel = 1; // First escalation
            } else {
                this.escalationLevel = 0; // Just overdue
            }
        } else {
            this.escalationLevel = 0;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateOverdueStatus();
    }
}
