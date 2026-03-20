package com.society.backend.ticket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Entity
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_number", unique = true)
    private String complaintNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "status_undo_previous_status")
    private String statusUndoPreviousStatus;

    @Column(name = "status_undo_previous_resolution", columnDefinition = "TEXT")
    private String statusUndoPreviousResolution;

    @Column(name = "status_undo_expires_at")
    private LocalDateTime statusUndoExpiresAt;

    @Column(name = "is_deleted")
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "delete_undo_previous_status")
    private String deleteUndoPreviousStatus;

    @Column(name = "delete_undo_previous_resolution", columnDefinition = "TEXT")
    private String deleteUndoPreviousResolution;

    @Column(name = "delete_undo_expires_at")
    private LocalDateTime deleteUndoExpiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (complaintNumber == null) {
            complaintNumber = "CMP-" + System.currentTimeMillis();
        }
    }
}
