package com.society.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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
     * Only applicable for SOCIETY_ADMIN and ORGANIZATION_OWNER roles.
     * - SOCIETY_ADMIN: Single society management
     * - ORGANIZATION_OWNER: Multiple society management (subscription-based)
     */
    @Column(name = "account_type")
    private String accountType;

    /**
     * Organization this user belongs to (for ORGANIZATION_OWNER role).
     * - PLATFORM_OWNER: null
     * - ORGANIZATION_OWNER: linked to their organization
     * - SOCIETY_ADMIN: optionally linked if created by an org owner
     * - Others: null (they belong to society, not org directly)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    /**
     * Society this user belongs to.
     * - PLATFORM_OWNER: null (has access to all societies)
     * - ORGANIZATION_OWNER: null (has access to org's societies)
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

    /**
     * Check if user is the platform owner (invisible global administrator)
     */
    public boolean isPlatformOwner() {
        return role == Role.PLATFORM_OWNER;
    }

    /**
     * Check if user is an organization owner (multi-society manager)
     */
    public boolean isOrganizationOwner() {
        return role == Role.ORGANIZATION_OWNER;
    }

    /**
     * Check if user has society-level admin rights
     */
    public boolean isSocietyAdmin() {
        return role == Role.SOCIETY_ADMIN || role == Role.PLATFORM_OWNER || role == Role.ORGANIZATION_OWNER;
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
}
