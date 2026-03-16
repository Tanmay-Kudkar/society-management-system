package com.society.backend.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Tenant;
import com.society.backend.society.entity.Society;
import com.society.backend.vendor.entity.Vendor;
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String phone;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Account type selected during signup.
     * Only applicable for SOCIETY_ADMIN role.
     */
    @Column(name = "account_type")
    private String accountType;

    /**
     * Society this user belongs to.
     * - MASTER_ADMIN: null (has access to all societies)
     * - SOCIETY_ADMIN and below: linked to specific society
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society;

    /**
     * Flat/Unit associated with this user.
     * Required for MEMBER and TENANT roles.
     * Optional for other roles.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "current_login_at")
    private LocalDateTime currentLoginAt;

    @Column(name = "current_login_user_agent", length = 1024)
    private String currentLoginUserAgent;

    @Column(name = "previous_login_at")
    private LocalDateTime previousLoginAt;

    @Column(name = "previous_login_user_agent", length = 1024)
    private String previousLoginUserAgent;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Check if user is the master admin (platform-wide full access)
     */
    public boolean isMasterAdmin() {
        return role == Role.MASTER_ADMIN;
    }

    /**
     * Check if user has society-level admin rights
     */
    public boolean isSocietyAdmin() {
        return role == Role.SOCIETY_ADMIN || role == Role.MASTER_ADMIN;
    }

    /**
     * Check if user is committee member (any governing body role)
     */
    public boolean isCommitteeMember() {
        return role == Role.CHAIRMAN || role == Role.SECRETARY ||
                role == Role.TREASURER || role == Role.COMMITTEE ||
                role == Role.SOCIETY_ADMIN;
    }

    /**
     * Check if user is at management level (can manage operations)
     */
    public boolean isManagementLevel() {
        return role == Role.MANAGER || role == Role.SECRETARY ||
                role == Role.SOCIETY_ADMIN;
    }

    /**
     * Check if user is a vendor
     */
    public boolean isVendor() {
        return role == Role.VENDOR;
    }
}
