package com.society.backend.ticket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.society.backend.user.entity.User;
@Entity
@Table(name = "approval_actions")
@Getter
@Setter
@NoArgsConstructor
public class ApprovalAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ApprovalRequest approvalRequest;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, length = 20)
    private String action; // APPROVED, REJECTED, RETURNED, ESCALATED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acted_by", nullable = false)
    private User actedBy;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
