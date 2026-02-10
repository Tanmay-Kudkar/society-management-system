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
     * Check if user is PLATFORM_OWNER
     */
    public void requireMasterAdmin(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER);
    }

    /**
     * Check if user is PLATFORM_OWNER or ORGANIZATION_OWNER
     */
    public void requirePlatformOrOrgOwner(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER);
    }

    /**
     * Check if user is PLATFORM_OWNER, ORGANIZATION_OWNER, SOCIETY_ADMIN, or
     * COMMITTEE
     */
    public void requireAdminOrCommittee(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN, Role.CHAIRMAN,
                Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user is PLATFORM_OWNER, ORGANIZATION_OWNER, SOCIETY_ADMIN,
     * COMMITTEE, MANAGER, or EMPLOYEE
     */
    public void requireStaff(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN, Role.CHAIRMAN,
                Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE);
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
     * Check if user can manage societies (PLATFORM_OWNER and ORGANIZATION_OWNER)
     */
    public void canManageSocieties(Long userId) {
        requirePlatformOrOrgOwner(userId);
    }

    /**
     * Check if user can manage flats (PLATFORM_OWNER, COMMITTEE)
     */
    public void canManageFlats(Long userId) {
        requireAdminOrCommittee(userId);
    }

    /**
     * Check if user can manage notices (PLATFORM_OWNER, COMMITTEE, EMPLOYEE)
     */
    public void canManageNotices(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can manage documents (PLATFORM_OWNER, COMMITTEE, EMPLOYEE)
     */
    public void canManageDocuments(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can update complaint status (PLATFORM_OWNER,
     * ORGANIZATION_OWNER, SOCIETY_ADMIN,
     * COMMITTEE, MANAGER, EMPLOYEE for status updates)
     */
    public void canUpdateComplaintStatus(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN, Role.COMMITTEE,
                Role.MANAGER, Role.EMPLOYEE);
    }

    /**
     * Check if user can create complaints (all except VISITOR)
     */
    public void canCreateComplaint(Long userId) {
        requireMember(userId);
    }

    /**
     * Check if user can view all data (PLATFORM_OWNER, COMMITTEE, EMPLOYEE)
     */
    public void canViewAll(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can manage vehicles (PLATFORM_OWNER, SOCIETY_ADMIN, CHAIRMAN,
     * SECRETARY, TREASURER, COMMITTEE, MANAGER, EMPLOYEE, MEMBER)
     */
    public void canManageVehicles(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE,
                Role.MANAGER, Role.EMPLOYEE, Role.MEMBER);
    }

    /**
     * Check if user can manage wings (PLATFORM_OWNER, SOCIETY_ADMIN, CHAIRMAN,
     * SECRETARY, TREASURER, COMMITTEE, MANAGER)
     */
    public void canManageWings(Long userId) {
        requireAdminOrCommittee(userId);
    }

    /**
     * Check if user can view financial reports (PLATFORM_OWNER, SOCIETY_ADMIN,
     * CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, MANAGER)
     */
    public void canViewReports(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user can manage complaints (view all, update status, delete)
     * (PLATFORM_OWNER, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE,
     * MANAGER)
     */
    public void canManageComplaints(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user can raise complaints (all except VISITOR and TENANT)
     */
    public void canRaiseComplaints(Long userId) {
        checkRole(userId, Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE,
                Role.MANAGER, Role.EMPLOYEE, Role.MEMBER, Role.TENANT);
    }
}
