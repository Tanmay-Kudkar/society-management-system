package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society;

    @Column(name = "email_tickets", nullable = false)
    private Boolean emailTickets = true;

    @Column(name = "email_complaints", nullable = false)
    private Boolean emailComplaints = true;

    @Column(name = "email_payments", nullable = false)
    private Boolean emailPayments = true;

    @Column(name = "email_contracts", nullable = false)
    private Boolean emailContracts = true;

    @Column(name = "email_tenants", nullable = false)
    private Boolean emailTenants = true;

    @Column(name = "email_notices", nullable = false)
    private Boolean emailNotices = true;

    public NotificationPreference(User user) {
        this.user = user;
    }
}
