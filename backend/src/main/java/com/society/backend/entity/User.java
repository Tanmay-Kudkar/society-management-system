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
     * Society this user belongs to.
     * - MASTER_ADMIN: null (has access to all societies)
     * - SOCIETY_ADMIN, COMMITTEE, EMPLOYEE, MEMBER: linked to specific society
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id")
    private Society society;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Check if user has society-level admin rights
     */
    public boolean isSocietyAdmin() {
        return role == Role.SOCIETY_ADMIN || role == Role.MASTER_ADMIN;
    }

    /**
     * Check if user is committee member (any committee role)
     */
    public boolean isCommitteeMember() {
        return role == Role.CHAIRMAN || role == Role.SECRETARY ||
                role == Role.TREASURER || role == Role.COMMITTEE ||
                role == Role.SOCIETY_ADMIN;
    }
}
