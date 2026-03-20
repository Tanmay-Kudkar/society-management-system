package com.society.backend.ticket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedToUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raised_for_user_id")
    private User raisedForUser;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(nullable = false)
    private String priority = "MEDIUM";

    @Column(name = "wing")
    private String wing;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "flat_number")
    private String flatNumber;

    @Column(name = "location_details")
    private String locationDetails;

    @ElementCollection
    @CollectionTable(name = "complaint_attachments", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "file_url", columnDefinition = "TEXT")
    private List<String> attachmentUrls = new ArrayList<>();

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "admin_remarks", columnDefinition = "TEXT")
    private String adminRemarks;

    @Column(name = "raised_for_reason", columnDefinition = "TEXT")
    private String raisedForReason;

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

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (complaintNumber == null) {
            complaintNumber = "CMP-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
