package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Column(name = "contract_type", nullable = false)
    private String contractType; // AMC, INSURANCE, PEST_CONTROL, HOUSEKEEPING, CCTV, LIFT, GENERATOR, SECURITY,
                                 // FD

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "reminder_days")
    private Integer reminderDays = 30; // days before expiry to remind

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isExpiringSoon() {
        if (endDate == null)
            return false;
        long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), endDate);
        return daysUntilExpiry <= reminderDays && daysUntilExpiry >= 0;
    }

    public boolean isExpired() {
        if (endDate == null)
            return false;
        return LocalDate.now().isAfter(endDate);
    }
}
