package com.society.backend.notification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.society.backend.flat.entity.Wing;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Entity
@Table(name = "classifieds")
@Getter
@Setter
@NoArgsConstructor
public class Classified {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by_id", nullable = false)
    private User postedBy;

    @Column(length = 50)
    private String flatNumber;

    @Column(length = 50)
    private String wing;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String category = "GENERAL";

    @Column(nullable = false, length = 20)
    private String listingType = "SELL";

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Boolean negotiable = false;

    @Column(name = "condition", length = 30)
    private String itemCondition;

    @Column(columnDefinition = "TEXT")
    private String imageUrls;

    @Column(length = 20)
    private String contactPhone;

    @Column(length = 200)
    private String contactEmail;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean flagged = false;

    @Column(columnDefinition = "TEXT")
    private String flagReason;

    @Column(nullable = false)
    private Integer views = 0;

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
