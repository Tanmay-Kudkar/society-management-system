package com.society.backend.ticket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.vendor.entity.Vendor;
@Entity
@Table(name = "approval_workflows")
@Getter
@Setter
@NoArgsConstructor
public class ApprovalWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // EXPENSE, RATE_CHANGE, VENDOR, VENDOR_BILL, MAINTENANCE, CUSTOM

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "min_amount")
    private BigDecimal minAmount = BigDecimal.ZERO;

    @Column(name = "max_amount")
    private BigDecimal maxAmount;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<ApprovalWorkflowStep> steps = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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
