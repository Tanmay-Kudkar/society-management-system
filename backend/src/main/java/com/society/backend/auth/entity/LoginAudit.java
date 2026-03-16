package com.society.backend.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.society.backend.user.entity.User;

@Entity
@Table(name = "login_audits", indexes = {
        @Index(name = "idx_login_audit_user", columnList = "user_id"),
        @Index(name = "idx_login_audit_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
public class LoginAudit {

    public enum Action {
        LOGIN, LOGOUT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "is_nearby")
    private Boolean isNearby;

    @Column(name = "distance_meters")
    private Double distanceMeters;

    @Column(name = "proximity_threshold_meters")
    private Double proximityThresholdMeters;

    /**
     * Always store timestamps in UTC so the frontend can reliably convert to
     * the user's local timezone (Asia/Kolkata).
     * — Local dev: JVM may run in IST, but ZoneOffset.UTC ensures we store UTC.
     * — Deployed (Render, etc.): JVM is already UTC, ZoneOffset.UTC keeps it consistent.
     * The frontend's parseServerDateTime() treats timezone-less strings as UTC
     * and formatDateTime() then renders them in Asia/Kolkata (IST).
     */
    public LoginAudit(User user, Action action, String ipAddress, String userAgent) {
        this.user = user;
        this.action = action;
        this.timestamp = LocalDateTime.now(ZoneOffset.UTC);
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public LoginAudit(User user, Action action, String ipAddress, String userAgent,
                      Double latitude, Double longitude) {
        this(user, action, ipAddress, userAgent);
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public LoginAudit(User user, Action action, String ipAddress, String userAgent,
                      Double latitude, Double longitude, Boolean isNearby,
                      Double distanceMeters, Double proximityThresholdMeters) {
        this(user, action, ipAddress, userAgent, latitude, longitude);
        this.isNearby = isNearby;
        this.distanceMeters = distanceMeters;
        this.proximityThresholdMeters = proximityThresholdMeters;
    }
}
