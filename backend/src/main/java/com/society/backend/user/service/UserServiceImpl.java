package com.society.backend.user.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.society.backend.user.dto.response.BulkCreateUsersResponse;
import com.society.backend.user.dto.request.UserRequest;
import com.society.backend.user.dto.response.UserResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.auth.repository.PasswordResetTokenRepository;
import com.society.backend.ticket.repository.ComplaintRepository;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.common.security.RolePermissions;
import com.society.backend.common.service.ReferenceCleanupService;

import com.society.backend.flat.entity.Tenant;
import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Complaint;
import com.society.backend.ticket.entity.Ticket;
@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    @Value("${security.master-admin.special-key:}")
    private String masterAdminSpecialKey;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintRepository complaintRepository;
    private final TicketRepository ticketRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final ReferenceCleanupService referenceCleanupService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ComplaintRepository complaintRepository, TicketRepository ticketRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository,
            ReferenceCleanupService referenceCleanupService,
            PasswordResetTokenRepository passwordResetTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.complaintRepository = complaintRepository;
        this.ticketRepository = ticketRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.referenceCleanupService = referenceCleanupService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Override
    public UserResponse createUser(UserRequest request) {
        log.info("Creating user with email: {}, role: {}", request.getEmail(), request.getRole());

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        // Validate password is provided for new users
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required for new users");
        }

        // Get the current logged-in user's role
        Role creatorRole = getCurrentUserRole();
        Role targetRole = resolveRole(request.getRole());

        // Validate permission to create this role
        if (!RolePermissions.canCreate(creatorRole, targetRole)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    RolePermissions.getPermissionDeniedMessage(creatorRole, targetRole));
        }

        // Prevent creating MASTER_ADMIN - there can only be one (hardcoded)
        if (targetRole == Role.MASTER_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "MASTER_ADMIN cannot be created. Only one exists.");
        }

        // Validate societyId is required when MASTER_ADMIN creates SOCIETY_ADMIN
        if (creatorRole == Role.MASTER_ADMIN && targetRole == Role.SOCIETY_ADMIN) {
            if (request.getSocietyId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Society selection is required when creating a Society Admin");
            }
        }

        // Enforce: each society can have at most 1 SOCIETY_ADMIN
        if (targetRole == Role.SOCIETY_ADMIN && request.getSocietyId() != null) {
            boolean adminExists = userRepository.existsBySocietyIdAndRole(request.getSocietyId(), Role.SOCIETY_ADMIN);
            if (adminExists) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "This society already has a Society Admin. Each society can have only one admin.");
            }
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(targetRole);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        // Assign society based on context
        User currentUser = getCurrentUser();

        if (creatorRole == Role.MASTER_ADMIN
                && request.getSocietyId() != null) {
            var society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            user.setSociety(society);

            // If this is a Society Admin, also update the society's telephone
            if (targetRole == Role.SOCIETY_ADMIN) {
                society.setTelephone(request.getPhone());
                societyRepository.save(society);
            }
        }
        // If creator is not top-level admin but has a society, inherit it
        else if (currentUser != null && currentUser.getSociety() != null) {
            user.setSociety(currentUser.getSociety());
        }

        Flat assignedFlat = null;
        boolean updateFlatOwnerAfterUserSave = false;

        // Handle flat assignment for resident unit roles
        if (isResidentUnitRole(targetRole)) {
            if (request.getFlatId() != null) {
                // Use provided flatId
                assignedFlat = flatRepository.findById(request.getFlatId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                "Unit/Flat not found with ID: " + request.getFlatId()));
                validateFlatAssignmentAvailability(assignedFlat, null);
                user.setFlat(assignedFlat);
                log.info("Assigned user {} to flat {}", request.getEmail(), assignedFlat.getFlatNumber());
            } else if (targetRole == Role.TENANT && creatorRole == Role.MEMBER && currentUser != null
                    && currentUser.getFlat() != null) {
                // MEMBER creating TENANT: automatically assign the MEMBER's flat to the TENANT
                assignedFlat = currentUser.getFlat();
                validateFlatAssignmentAvailability(assignedFlat, null);
                user.setFlat(assignedFlat);
                log.info("Auto-assigned TENANT {} to MEMBER's flat {}", request.getEmail(), assignedFlat.getFlatNumber());
            } else {
                // Flat is mandatory for resident unit roles
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Flat/Unit assignment is required for MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE roles");
            }

            if (assignedFlat != null && targetRole == Role.MEMBER) {
                // Defer owner linkage until after user is persisted to avoid transient entity flush errors.
                updateFlatOwnerAfterUserSave = true;
            }
        } else if (request.getFlatId() != null) {
            // Optional flat assignment for management roles (CHAIRMAN, SECRETARY, TREASURER, COMMITTEE)
            if (targetRole == Role.CHAIRMAN || targetRole == Role.SECRETARY || 
                targetRole == Role.TREASURER || targetRole == Role.COMMITTEE) {
                assignedFlat = flatRepository.findById(request.getFlatId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                "Unit/Flat not found with ID: " + request.getFlatId()));
                validateFlatAssignmentAvailability(assignedFlat, null);
                user.setFlat(assignedFlat);
                log.info("Optionally assigned {} role {} to flat {}", targetRole, request.getEmail(), assignedFlat.getFlatNumber());
            } else {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        targetRole.name() + " role cannot be assigned to a unit");
            }
        }

        User saved = userRepository.save(user);

        if (assignedFlat != null) {
            synchronizeFlatAssignment(null, assignedFlat, saved, targetRole);
            if (updateFlatOwnerAfterUserSave) {
                log.info("Updated flat {} ownership to user {}", assignedFlat.getFlatNumber(), saved.getEmail());
            }
        }

        log.info("User created successfully with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        Role currentRole = getCurrentUserRole();
        User currentUser = getCurrentUser();

        // MASTER_ADMIN sees all users
        if (currentRole == Role.MASTER_ADMIN) {
            return userRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        // SOCIETY_ADMIN and below see only users in their society (excluding
        // MASTER_ADMIN)
        if (currentUser != null && currentUser.getSociety() != null) {
            Long societyId = currentUser.getSociety().getId();
            return userRepository.findBySocietyId(societyId)
                    .stream()
                    .filter(u -> u.getRole() != Role.MASTER_ADMIN) // Exclude MASTER_ADMIN
                    .filter(u -> u.getSociety() != null && u.getSociety().getId().equals(societyId)) // Double-check
                                                                                                     // society match
                    .map(this::mapToResponse)
                    .toList();
        }

        // No society assigned, return current user only if available
        if (currentUser != null) {
            return List.of(mapToResponse(currentUser));
        }

        // No society assigned, return empty
        return List.of();
    }

    @Override
    public List<UserResponse> getUsersBySociety(Long societyId) {
        return userRepository.findBySocietyId(societyId)
                .stream()
                .filter(u -> u.getRole() != Role.MASTER_ADMIN)
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Get the roles that the current user can create.
     */
    @Override
    public Set<Role> getCreatableRoles() {
        Role currentRole = getCurrentUserRole();
        return RolePermissions.getAllowedRolesToCreate(currentRole);
    }

    /**
     * Get the roles that the current user can update/delete.
     */
    @Override
    public Set<Role> getUpdatableRoles() {
        Role currentRole = getCurrentUserRole();
        return RolePermissions.getAllowedRolesToUpdate(currentRole);
    }

    @Override
    public BulkCreateUsersResponse bulkCreateUsersForUnits(Long societyId) {
        log.info("Starting bulk user creation for society ID: {}", societyId);

        // Verify society exists
        var society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        // Get all flats in the society
        List<Flat> flats = flatRepository.findBySocietyId(societyId);

        BulkCreateUsersResponse response = new BulkCreateUsersResponse();
        response.setTotalUnits(flats.size());

        int created = 0;
        int skipped = 0;
        int errors = 0;

        for (Flat flat : flats) {
            try {
                // Check if flat already has a user assigned
                if (userRepository.existsByFlatId(flat.getId())) {
                    response.getResults().add(BulkCreateUsersResponse.BulkCreateResult.skipped(
                            flat.getId(), flat.getFlatNumber(), "User already exists for this unit"));
                    skipped++;
                    continue;
                }

                // Check if flat has owner email (required for creating user)
                if (flat.getOwnerEmail() == null || flat.getOwnerEmail().trim().isEmpty()) {
                    response.getResults().add(BulkCreateUsersResponse.BulkCreateResult.skipped(
                            flat.getId(), flat.getFlatNumber(), "No owner email configured for this unit"));
                    skipped++;
                    continue;
                }

                // Check if email already exists
                if (userRepository.findByEmail(flat.getOwnerEmail()).isPresent()) {
                    response.getResults().add(BulkCreateUsersResponse.BulkCreateResult.skipped(
                            flat.getId(), flat.getFlatNumber(), "Email already registered: " + flat.getOwnerEmail()));
                    skipped++;
                    continue;
                }

                // Create user with flat number as default password
                User user = new User();
                user.setName(flat.getOwnerName() != null ? flat.getOwnerName() : "Member " + flat.getFlatNumber());
                user.setEmail(flat.getOwnerEmail().trim().toLowerCase());
                user.setPassword(passwordEncoder.encode(flat.getFlatNumber())); // Use flat number as password
                user.setPhone(flat.getOwnerPhone());
                user.setRole(Role.MEMBER);
                user.setSociety(society);
                user.setFlat(flat);
                user.setIsActive(true);
                user.setCreatedAt(java.time.LocalDateTime.now());

                User savedUser = userRepository.save(user);

                response.getResults().add(BulkCreateUsersResponse.BulkCreateResult.created(
                        flat.getId(), flat.getFlatNumber(), savedUser.getEmail(), savedUser.getId()));
                created++;

                log.info("Created user {} for flat {}", savedUser.getEmail(), flat.getFlatNumber());

            } catch (Exception e) {
                log.error("Error creating user for flat {}: {}", flat.getFlatNumber(), e.getMessage());
                response.getResults().add(BulkCreateUsersResponse.BulkCreateResult.error(
                        flat.getId(), flat.getFlatNumber(), e.getMessage()));
                errors++;
            }
        }

        response.setUsersCreated(created);
        response.setUsersSkipped(skipped);
        response.setErrors(errors);
        response.setMessage(
                String.format("Bulk creation complete: %d created, %d skipped, %d errors out of %d total units",
                        created, skipped, errors, flats.size()));

        log.info("Bulk user creation completed: {}", response.getMessage());

        return response;
    }

    @Override
    public UserResponse getUserById(Long id) {
        // Use query that eagerly loads society and flat to avoid lazy loading issues
        User user = userRepository.findByIdWithSocietyAndFlat(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        return mapToResponse(user);
    }

    @Override
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // Get current user's role and validate UPDATE permission
        Role currentRole = getCurrentUserRole();
        Role targetRole = user.getRole();

        // Users can update their own profile (except role change)
        User currentUser = getCurrentUser();
        boolean isSelfUpdate = currentUser != null && currentUser.getId().equals(id);

        if (!isSelfUpdate) {
            // Check if current user can update this target role
            if (!RolePermissions.canUpdate(currentRole, targetRole)) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        RolePermissions.getUpdatePermissionDeniedMessage(currentRole, targetRole));
            }

            // For non-master users, verify same society
                if (currentRole != Role.MASTER_ADMIN
                    && currentUser != null && currentUser.getSociety() != null) {
                if (user.getSociety() == null || !user.getSociety().getId().equals(currentUser.getSociety().getId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update users from different society");
                }
            }
        }

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        if (user.getRole() == Role.MASTER_ADMIN && !user.getEmail().equals(request.getEmail())) {
            String providedSpecialKey = request.getSpecialKey() != null
                ? request.getSpecialKey().trim()
                    : "";
            String configuredSpecialKey = masterAdminSpecialKey != null
                ? masterAdminSpecialKey.trim()
                    : "";

            if (configuredSpecialKey.isEmpty()) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                "Master admin email change is disabled until special key is configured.");
            }

            if (!configuredSpecialKey.equals(providedSpecialKey)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Invalid special key for master admin email change");
            }
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setPhone(request.getPhone());

        // Update society telephone if this is a SOCIETY_ADMIN
        if (user.getRole() == Role.SOCIETY_ADMIN && user.getSociety() != null) {
            user.getSociety().setTelephone(request.getPhone());
            societyRepository.save(user.getSociety());
        }

        // Role change is only allowed if not self-update and if permitted
        Role updatedRole = user.getRole();
        if (request.getRole() != null && !isSelfUpdate) {
            Role newRole = resolveRole(request.getRole());
            // Verify permission to change to new role
            if (!RolePermissions.canCreate(currentRole, newRole)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Cannot change role to " + newRole + ". You can only assign roles you can create.");
            }
            updatedRole = newRole;
            user.setRole(newRole);
        }

        // Allow top-level admins to update society assignment
        if (request.getSocietyId() != null &&
            getCurrentUserRole() == Role.MASTER_ADMIN) {
            user.setSociety(societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found")));
        }

        Flat previousFlat = user.getFlat();
        Flat assignedFlat = previousFlat;

        if (isResidentUnitRole(updatedRole)) {
            Long targetFlatId = request.getFlatId() != null
                    ? request.getFlatId()
                    : previousFlat != null ? previousFlat.getId() : null;

            if (targetFlatId == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Flat/Unit assignment is required for MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE roles");
            }

            assignedFlat = flatRepository.findById(targetFlatId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                            "Unit/Flat not found with ID: " + targetFlatId));
            validateFlatAssignmentAvailability(assignedFlat, user.getId());
            user.setFlat(assignedFlat);
        } else if (request.getFlatId() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    updatedRole.name() + " role cannot be assigned to a unit");
        } else {
            assignedFlat = null;
            user.setFlat(null);
        }

        User saved = userRepository.save(user);
        synchronizeFlatAssignment(previousFlat, assignedFlat, saved, updatedRole);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, boolean force) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // Prevent deleting MASTER_ADMIN
        if (user.getRole() == Role.MASTER_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete MASTER_ADMIN");
        }

        // Get current user's role and validate DELETE permission
        Role currentRole = getCurrentUserRole();
        Role targetRole = user.getRole();

        // Check if current user can delete this target role
        if (!RolePermissions.canDelete(currentRole, targetRole)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    RolePermissions.getDeletePermissionDeniedMessage(currentRole, targetRole));
        }

        // For non-master users, verify same society
        User currentUser = getCurrentUser();
        if (currentRole != Role.MASTER_ADMIN
                && currentUser != null && currentUser.getSociety() != null) {
            if (user.getSociety() == null || !user.getSociety().getId().equals(currentUser.getSociety().getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete users from different society");
            }
        }

        // Check for related records
        java.util.List<String> associations = new java.util.ArrayList<>();

        // Check complaints
        int complaintCount = complaintRepository.findByUserId(id).size();
        if (complaintCount > 0) {
            associations.add(complaintCount + " complaint(s)");
        }

        // Check tickets raised by user
        int ticketsRaisedCount = ticketRepository.findByRaisedById(id).size();
        if (ticketsRaisedCount > 0) {
            associations.add(ticketsRaisedCount + " ticket(s) raised");
        }

        // Check tickets assigned to user
        int ticketsAssignedCount = ticketRepository.findByAssignedToId(id).size();
        if (ticketsAssignedCount > 0) {
            associations.add(ticketsAssignedCount + " ticket(s) assigned");
        }

        if (!force && !associations.isEmpty()) {
            String message = "Cannot delete user '" + user.getName() + "'. User is associated with: "
                    + String.join(", ", associations)
                    + ". Please reassign or delete these records first. Use force delete to auto-clean linked records.";
            throw new ApiException(HttpStatus.CONFLICT, message);
        }

        // Always clean up password reset tokens (non-nullable FK, must be removed)
        passwordResetTokenRepository.deleteByUser(user);

        // Clean up notification preferences (non-nullable FK user_id UNIQUE)
        referenceCleanupService.clearReferences("user_id", id, true, Set.of("users"));

        if (force) {
            referenceCleanupService.clearReferences("owner_user_id", id, false, Set.of("users"));
            referenceCleanupService.clearReferences("assigned_to_id", id, false, Set.of("users"));
            referenceCleanupService.clearReferences("raised_by_id", id, true, Set.of("users"));
        }

        // Clear flat ownership if this user owned a flat
        if (user.getFlat() != null) {
            Flat flat = user.getFlat();
            if (flat.getOwner() != null && flat.getOwner().getId().equals(id)) {
                flat.setOwner(null);
                flat.setIsOccupied(false);
                flatRepository.save(flat);
            }
        }

        userRepository.delete(user);
    }

    private Role resolveRole(String roleValue) {
        if (roleValue == null || roleValue.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        try {
            return Role.valueOf(roleValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role: " + roleValue);
        }
    }

    private boolean isResidentUnitRole(Role role) {
        // MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE require flat assignment
        return role == Role.MEMBER
                || role == Role.TENANT
                || role == Role.CHAIRMAN
                || role == Role.SECRETARY
                || role == Role.TREASURER
                || role == Role.COMMITTEE;
    }

    private void validateFlatAssignmentAvailability(Flat flat, Long excludedUserId) {
        userRepository.findByFlatId(flat.getId()).stream()
                .filter(existingUser -> excludedUserId == null || !existingUser.getId().equals(excludedUserId))
                .findFirst()
                .ifPresent(existingUser -> {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Unit " + flat.getFlatNumber() + " already has an assigned user: " + existingUser.getName());
                });
    }

    private void synchronizeFlatAssignment(Flat previousFlat, Flat assignedFlat, User savedUser, Role role) {
        if (previousFlat != null && (assignedFlat == null || !previousFlat.getId().equals(assignedFlat.getId()))) {
            clearFlatAssignment(previousFlat, savedUser.getId());
        }

        if (assignedFlat == null) {
            return;
        }

        if (role == Role.MEMBER) {
            assignedFlat.setOwner(savedUser);
            assignedFlat.setOwnerName(savedUser.getName());
            assignedFlat.setOwnerEmail(savedUser.getEmail());
            assignedFlat.setOwnerPhone(savedUser.getPhone());
        } else if (assignedFlat.getOwner() != null && assignedFlat.getOwner().getId().equals(savedUser.getId())) {
            assignedFlat.setOwner(null);
            assignedFlat.setOwnerName(null);
            assignedFlat.setOwnerEmail(null);
            assignedFlat.setOwnerPhone(null);
        }

        assignedFlat.setIsOccupied(true);
        flatRepository.save(assignedFlat);
    }

    private void clearFlatAssignment(Flat flat, Long userId) {
        if (flat.getOwner() != null && flat.getOwner().getId().equals(userId)) {
            flat.setOwner(null);
            flat.setOwnerName(null);
            flat.setOwnerEmail(null);
            flat.setOwnerPhone(null);
        }
        flat.setIsOccupied(false);
        flatRepository.save(flat);
    }

    private Role getCurrentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        String roleString = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No role found"));

        try {
            return Role.valueOf(roleString);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid role in authentication context");
        }
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        // Use the method that eagerly loads both society and flat to avoid lazy loading
        // issues
        return userRepository.findByEmailWithSocietyAndFlat(auth.getName()).orElse(null);
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                user.getIsActive(),
                user.getSociety() != null ? user.getSociety().getId() : null,
                user.getSociety() != null ? user.getSociety().getName() : null);

        // Add flat information if available
        if (user.getFlat() != null) {
            response.setFlatId(user.getFlat().getId());
            response.setFlatNumber(user.getFlat().getFlatNumber());
        }

        response.setAccountType(user.getAccountType());

        return response;
    }
}



