package com.society.backend.security.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.society.backend.society.entity.Society;
@Entity
@Table(name = "patrol_checkpoints")
@Getter
@Setter
@NoArgsConstructor
public class PatrolCheckpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @Column(name = "checkpoint_name", nullable = false)
    private String checkpointName;

    @Column
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "display_order")
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
