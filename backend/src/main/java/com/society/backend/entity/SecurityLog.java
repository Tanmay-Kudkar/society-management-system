package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_logs")
@Data
public class SecurityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "society_id")
    private Long societyId;

    @Transient
    private Long organizationId;

    @Column(nullable = false)
    private String event;

    @Column(nullable = false)
    private String type; // SECURITY, SYSTEM, ALERT, MAINTENANCE

    @Column(nullable = false)
    private String status; // Approved, Blocked, Info, Success, Warning

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
