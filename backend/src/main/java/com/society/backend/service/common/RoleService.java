package com.society.backend.service.common;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.AccessDeniedException;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class RoleService {

    private final UserRepository userRepository;

    public RoleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get user by ID or throw exception
     */
    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /**
     * Check if user has any of the allowed roles
     */
    public void checkRole(Long userId, Role... allowedRoles) {
        User user = getUser(userId);
        List<Role> allowed = Arrays.asList(allowedRoles);

        if (!allowed.contains(user.getRole())) {
            throw new AccessDeniedException(
                    "Access denied. Required roles: " + allowed + ", Your role: " + user.getRole());
        }
    }

    /**
     * Check if user is MASTER_ADMIN
     */
    public void requireMasterAdmin(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN);
    }

    /**
     * Check if user is MASTER_ADMIN, SOCIETY_ADMIN, or COMMITTEE
     */
    public void requireAdminOrCommittee(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN, Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE);
    }

    /**
     * Check if user is MASTER_ADMIN, SOCIETY_ADMIN, COMMITTEE, or EMPLOYEE
     */
    public void requireStaff(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN, Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.EMPLOYEE);
    }

    /**
     * Check if user is any registered member (not visitor)
     */
    public void requireMember(Long userId) {
        User user = getUser(userId);
        if (user.getRole() == Role.VISITOR) {
            throw new AccessDeniedException(
                    "Access denied. VISITOR cannot perform this action.");
        }
    }

    /**
     * Check if user can manage societies (MASTER_ADMIN only)
     */
    public void canManageSocieties(Long userId) {
        requireMasterAdmin(userId);
    }

    /**
     * Check if user can manage flats (MASTER_ADMIN, COMMITTEE)
     */
    public void canManageFlats(Long userId) {
        requireAdminOrCommittee(userId);
    }

    /**
     * Check if user can manage notices (MASTER_ADMIN, COMMITTEE, EMPLOYEE)
     */
    public void canManageNotices(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can manage complaints (MASTER_ADMIN, SOCIETY_ADMIN,
     * COMMITTEE, EMPLOYEE for status updates)
     */
    public void canUpdateComplaintStatus(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE, Role.EMPLOYEE);
    }

    /**
     * Check if user can create complaints (all except VISITOR)
     */
    public void canCreateComplaint(Long userId) {
        requireMember(userId);
    }

    /**
     * Check if user can view all data (MASTER_ADMIN, COMMITTEE, EMPLOYEE)
     */
    public void canViewAll(Long userId) {
        requireStaff(userId);
    }
}
