package com.society.backend.service.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.society.backend.dto.user.BulkCreateUsersResponse;
import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.complaint.ComplaintRepository;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.organization.OrganizationRepository;
import com.society.backend.repository.ticket.TicketRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.security.RolePermissions;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintRepository complaintRepository;
    private final TicketRepository ticketRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final OrganizationRepository organizationRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ComplaintRepository complaintRepository, TicketRepository ticketRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository,
            OrganizationRepository organizationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.complaintRepository = complaintRepository;
        this.ticketRepository = ticketRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.organizationRepository = organizationRepository;
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

        // Prevent creating PLATFORM_OWNER - there can only be one (hardcoded)
        if (targetRole == Role.PLATFORM_OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PLATFORM_OWNER cannot be created. Only one exists.");
        }

        // Prevent creating ORGANIZATION_OWNER through user API
        // (they register through a separate signup flow)
        if (targetRole == Role.ORGANIZATION_OWNER && creatorRole != Role.PLATFORM_OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ORGANIZATION_OWNER can only be created by PLATFORM_OWNER");
        }

        // Validate societyId is required when PLATFORM_OWNER creates SOCIETY_ADMIN
        if (creatorRole == Role.PLATFORM_OWNER && targetRole == Role.SOCIETY_ADMIN) {
            if (request.getSocietyId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Society selection is required when creating a Society Admin");
            }
        }

        // Validate societyId when ORGANIZATION_OWNER creates SOCIETY_ADMIN
        if (creatorRole == Role.ORGANIZATION_OWNER && targetRole == Role.SOCIETY_ADMIN) {
            if (request.getSocietyId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Society selection is required when creating a Society Admin");
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

        // If PLATFORM_OWNER or ORGANIZATION_OWNER is creating any user and provides
        // societyId, use it
        if ((creatorRole == Role.PLATFORM_OWNER || creatorRole == Role.ORGANIZATION_OWNER)
                && request.getSocietyId() != null) {
            var society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            // If ORGANIZATION_OWNER, verify the society belongs to their organization
            if (creatorRole == Role.ORGANIZATION_OWNER && currentUser != null
                    && currentUser.getOrganization() != null) {
                if (society.getOrganization() == null
                        || !society.getOrganization().getId().equals(currentUser.getOrganization().getId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN,
                            "Cannot assign user to a society outside your organization");
                }
            }
            user.setSociety(society);

            // If this is a Society Admin, also update the society's telephone
            if (targetRole == Role.SOCIETY_ADMIN) {
                society.setTelephone(request.getPhone());
                societyRepository.save(society);
            }
        }
        // If creator is not PLATFORM_OWNER/ORGANIZATION_OWNER but has a society,
        // inherit it
        else if (currentUser != null && currentUser.getSociety() != null) {
            user.setSociety(currentUser.getSociety());
        }

        // Assign organization based on context
        if (targetRole == Role.ORGANIZATION_OWNER) {
            // Creating an ORGANIZATION_OWNER: link to existing org or auto-create one
            if (request.getOrganizationId() != null) {
                // Link to existing organization
                var org = organizationRepository.findById(request.getOrganizationId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
                user.setOrganization(org);
            } else {
                // Auto-create a new organization for this owner
                var org = new com.society.backend.entity.Organization();
                org.setName(request.getOrganizationName() != null && !request.getOrganizationName().isBlank()
                        ? request.getOrganizationName()
                        : request.getName() + "'s Organization");
                org.setOwnerName(request.getName());
                org.setOwnerEmail(request.getEmail());
                org.setOwnerPhone(request.getPhone());
                org.setSubscriptionType("FREE");
                org.setSubscriptionStatus("ACTIVE");
                org.setMaxSocieties(1);
                org.setIsActive(true);
                org.setCreatedAt(LocalDateTime.now());
                org = organizationRepository.save(org);
                user.setOrganization(org);
                log.info("Auto-created organization '{}' for ORGANIZATION_OWNER {}", org.getName(), request.getEmail());
            }
        } else if (currentUser != null && currentUser.getOrganization() != null) {
            // Inherit organization from creator if applicable
            user.setOrganization(currentUser.getOrganization());
        }

        // Handle flat assignment for MEMBER and TENANT roles
        if (targetRole == Role.MEMBER || targetRole == Role.TENANT) {
            Flat flat = null;
            if (request.getFlatId() != null) {
                // Use provided flatId
                flat = flatRepository.findById(request.getFlatId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                "Unit/Flat not found with ID: " + request.getFlatId()));
                user.setFlat(flat);
                log.info("Assigned user {} to flat {}", request.getEmail(), flat.getFlatNumber());
            } else if (targetRole == Role.TENANT && creatorRole == Role.MEMBER && currentUser != null
                    && currentUser.getFlat() != null) {
                // MEMBER creating TENANT: automatically assign the MEMBER's flat to the TENANT
                flat = currentUser.getFlat();
                user.setFlat(flat);
                log.info("Auto-assigned TENANT {} to MEMBER's flat {}", request.getEmail(), flat.getFlatNumber());
            } else {
                log.warn("No flatId provided for MEMBER/TENANT user: {}", request.getEmail());
            }

            // Update flat ownership for MEMBER role (not TENANT - they don't own the flat)
            if (flat != null && targetRole == Role.MEMBER) {
                flat.setOwner(user);
                flat.setOwnerName(user.getName());
                flat.setOwnerEmail(user.getEmail());
                flat.setOwnerPhone(user.getPhone());
                flat.setIsOccupied(true);
                flatRepository.save(flat);
                log.info("Updated flat {} ownership to user {}", flat.getFlatNumber(), user.getEmail());
            }

            // Mark flat as occupied for TENANT (but don't change owner)
            if (flat != null && targetRole == Role.TENANT) {
                flat.setIsOccupied(true);
                flatRepository.save(flat);
            }
        }

        User saved = userRepository.save(user);
        log.info("User created successfully with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        Role currentRole = getCurrentUserRole();
        User currentUser = getCurrentUser();

        // PLATFORM_OWNER sees all users
        if (currentRole == Role.PLATFORM_OWNER) {
            return userRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        // ORGANIZATION_OWNER sees all users in their organization's societies
        if (currentRole == Role.ORGANIZATION_OWNER && currentUser != null && currentUser.getOrganization() != null) {
            Long orgId = currentUser.getOrganization().getId();
            // Get all societies in this organization
            List<Long> orgSocietyIds = societyRepository.findByOrganizationId(orgId)
                    .stream()
                    .map(s -> s.getId())
                    .toList();
            return userRepository.findAll()
                    .stream()
                    .filter(u -> u.getRole() != Role.PLATFORM_OWNER) // Exclude PLATFORM_OWNER
                    .filter(u -> {
                        // Include users from org's societies
                        if (u.getSociety() != null && orgSocietyIds.contains(u.getSociety().getId()))
                            return true;
                        // Include users directly in this organization (like society admins)
                        if (u.getOrganization() != null && u.getOrganization().getId().equals(orgId))
                            return true;
                        return false;
                    })
                    .map(this::mapToResponse)
                    .toList();
        }

        // SOCIETY_ADMIN and below see only users in their society (excluding
        // PLATFORM_OWNER)
        if (currentUser != null && currentUser.getSociety() != null) {
            Long societyId = currentUser.getSociety().getId();
            return userRepository.findBySocietyId(societyId)
                    .stream()
                    .filter(u -> u.getRole() != Role.PLATFORM_OWNER) // Exclude PLATFORM_OWNER
                    .filter(u -> u.getRole() != Role.ORGANIZATION_OWNER) // Exclude ORGANIZATION_OWNER
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
                .filter(u -> u.getRole() != Role.PLATFORM_OWNER)
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

            // For non-PLATFORM_OWNER/ORGANIZATION_OWNER, verify same society
            if (currentRole != Role.PLATFORM_OWNER && currentRole != Role.ORGANIZATION_OWNER
                    && currentUser != null && currentUser.getSociety() != null) {
                if (user.getSociety() == null || !user.getSociety().getId().equals(currentUser.getSociety().getId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update users from different society");
                }
            }
        }

        // For ORGANIZATION_OWNER, verify user belongs to their organization
        if (currentRole == Role.ORGANIZATION_OWNER && currentUser != null && currentUser.getOrganization() != null) {
            Long orgId = currentUser.getOrganization().getId();
            boolean belongsToOrg = false;
            if (user.getOrganization() != null && user.getOrganization().getId().equals(orgId))
                belongsToOrg = true;
            if (user.getSociety() != null && user.getSociety().getOrganization() != null
                    && user.getSociety().getOrganization().getId().equals(orgId))
                belongsToOrg = true;
            if (!belongsToOrg) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update users from different organization");
            }
        }

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
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
        if (request.getRole() != null && !isSelfUpdate) {
            Role newRole = resolveRole(request.getRole());
            // Verify permission to change to new role
            if (!RolePermissions.canCreate(currentRole, newRole)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Cannot change role to " + newRole + ". You can only assign roles you can create.");
            }
            user.setRole(newRole);
        }

        // Allow PLATFORM_OWNER and ORGANIZATION_OWNER to update society assignment
        if (request.getSocietyId() != null &&
                (getCurrentUserRole() == Role.PLATFORM_OWNER || getCurrentUserRole() == Role.ORGANIZATION_OWNER)) {
            user.setSociety(societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found")));
        }

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // Prevent deleting PLATFORM_OWNER
        if (user.getRole() == Role.PLATFORM_OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete PLATFORM_OWNER");
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

        // For non-PLATFORM_OWNER/ORGANIZATION_OWNER, verify same society
        User currentUser = getCurrentUser();
        if (currentRole != Role.PLATFORM_OWNER && currentRole != Role.ORGANIZATION_OWNER
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

        if (!associations.isEmpty()) {
            String message = "Cannot delete user '" + user.getName() + "'. User is associated with: "
                    + String.join(", ", associations)
                    + ". Please reassign or delete these records first.";
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
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

    private Role getCurrentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        String roleString = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No role found"));

        return Role.valueOf(roleString);
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

        // Add organization information if available
        response.setAccountType(user.getAccountType());
        if (user.getOrganization() != null) {
            response.setOrganizationId(user.getOrganization().getId());
            response.setOrganizationName(user.getOrganization().getName());
        }

        return response;
    }
}
