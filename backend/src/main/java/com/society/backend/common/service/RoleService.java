package com.society.backend.common.service;

import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.AccessDeniedException;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

import com.society.backend.flat.entity.Tenant;
import com.society.backend.security.entity.Visitor;
import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Complaint;
import com.society.backend.vendor.entity.Vendor;
@Service
public class RoleService {

    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;

    public RoleService(UserRepository userRepository, SocietyRepository societyRepository) {
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
    }

    /**
     * Get user by ID or throw exception
     */
    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /**
     * Get the currently authenticated user.
     */
    public User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByEmailWithSociety(auth.getName()).orElse(null);
    }

    /**
     * Require MASTER_ADMIN for platform-wide operations.
     */
    public void requireMasterAdmin(User user) {
        if (user == null || user.getRole() != Role.MASTER_ADMIN) {
            throw new AccessDeniedException("Access denied. MASTER_ADMIN only.");
        }
    }

    /**
     * Enforce society scope for the current user.
     * MASTER_ADMIN bypasses all scope checks.
     */
    public void enforceSocietyScope(User user, Long societyId) {
        if (user == null) {
            throw new AccessDeniedException("Access denied. Not authenticated.");
        }
        if (user.getRole() == Role.MASTER_ADMIN) {
            return; // MASTER_ADMIN has access to all societies
        }
        if (societyId == null) {
            throw new AccessDeniedException("Access denied. Society scope required.");
        }
        // Society-level roles must match their own society
        if (user.getSociety() == null || !societyId.equals(user.getSociety().getId())) {
            throw new AccessDeniedException("Access denied. Society scope mismatch.");
        }
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
     * Check if user is MASTER_ADMIN or SOCIETY_ADMIN
     */
    public void requireAdminOrAbove(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN);
    }

    /**
     * Check if user is MASTER_ADMIN, SOCIETY_ADMIN, or any head/committee role
     */
    public void requireAdminOrCommittee(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user is MASTER_ADMIN, SOCIETY_ADMIN, head roles, COMMITTEE,
     * MANAGER, or EMPLOYEE
     */
    public void requireStaff(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Ticket management roles (committee excluded):
     * MASTER_ADMIN, SOCIETY_ADMIN, C/S/T, MANAGER, EMPLOYEE.
     */
    public void requireTicketManager(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.MANAGER);
    }

    /**
     * Ticket assignment roles: MASTER_ADMIN, SOCIETY_ADMIN, C/S/T, MANAGER.
     */
    public void requireTicketAssigner(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.MANAGER);
    }

    /**
     * Check if user is any registered member (not VISITOR or VENDOR)
     */
    public void requireMember(Long userId) {
        User user = getUser(userId);
        if (user.getRole() == Role.VISITOR || user.getRole() == Role.VENDOR) {
            throw new AccessDeniedException(
                    "Access denied. VISITOR and VENDOR cannot perform this action.");
        }
    }

    /**
     * Check if user can manage societies (MASTER_ADMIN only)
     */
    public void canManageSocieties(Long userId) {
        requireMasterAdmin(userId);
    }

    /**
     * Check if user can manage flats
     */
    public void canManageFlats(Long userId) {
        requireAdminOrCommittee(userId);
    }

    /**
     * Check if user can manage notices
     */
    public void canManageNotices(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER);
    }

    /**
     * Record own attendance for meeting notices.
     */
    public void canRecordMeetingAttendance(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE);
    }

    /**
     * View all attendance records for a meeting notice.
     */
    public void canViewMeetingAttendance(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER);
    }

    /**
     * Check if user can manage documents
     */
    public void canManageDocuments(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can update complaint status
     */
    public void canUpdateComplaintStatus(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user can create complaints (all except VISITOR and VENDOR)
     */
    public void canCreateComplaint(Long userId) {
        requireMember(userId);
    }

    /**
     * Check if user can view all data
     */
    public void canViewAll(Long userId) {
        requireStaff(userId);
    }

    /**
     * Check if user can manage vehicles
     */
    public void canManageVehicles(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE,
                Role.MANAGER, Role.MEMBER);
    }

    /**
     * Check if user can manage wings
     */
    public void canManageWings(Long userId) {
        requireAdminOrCommittee(userId);
    }

    /**
     * Check if user can view financial reports
     */
    public void canViewReports(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user can manage complaints (view all, update status, delete)
     */
    public void canManageComplaints(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                Role.COMMITTEE, Role.MANAGER);
    }

    /**
     * Check if user can raise complaints (all except VISITOR and VENDOR)
     */
    public void canRaiseComplaints(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.COMMITTEE,
                Role.MANAGER, Role.MEMBER, Role.TENANT);
    }

    /**
     * Check if user can manage financials (no COMMITTEE write access)
     */
    public void canManageFinancials(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.MANAGER);
    }

    /**
     * Employee HR record access roles.
     */
    public void requireEmployeeRecordAccess(Long userId) {
        checkRole(userId, Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER, Role.MANAGER);
    }
}
