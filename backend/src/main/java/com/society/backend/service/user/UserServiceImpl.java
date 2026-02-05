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

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ComplaintRepository complaintRepository, TicketRepository ticketRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.complaintRepository = complaintRepository;
        this.ticketRepository = ticketRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
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
                throw new ApiException(HttpStatus.BAD_REQUEST, "Society selection is required when creating a Society Admin");
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

        // If MASTER_ADMIN is creating any user and provides societyId, use it
        if (creatorRole == Role.MASTER_ADMIN && request.getSocietyId() != null) {
            user.setSociety(societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found")));
        }
        // If creator is not MASTER_ADMIN but has a society, inherit it
        else if (currentUser != null && currentUser.getSociety() != null) {
            user.setSociety(currentUser.getSociety());
        }

        // Handle flat assignment for MEMBER and TENANT roles
        if (targetRole == Role.MEMBER || targetRole == Role.TENANT) {
            if (request.getFlatId() != null) {
                Flat flat = flatRepository.findById(request.getFlatId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit/Flat not found with ID: " + request.getFlatId()));
                user.setFlat(flat);
                log.info("Assigned user {} to flat {}", request.getEmail(), flat.getFlatNumber());
            } else {
                log.warn("No flatId provided for MEMBER/TENANT user: {}", request.getEmail());
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
        response.setMessage(String.format("Bulk creation complete: %d created, %d skipped, %d errors out of %d total units",
                created, skipped, errors, flats.size()));
        
        log.info("Bulk user creation completed: {}", response.getMessage());
        
        return response;
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
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

            // For non-MASTER_ADMIN, verify same society
            if (currentRole != Role.MASTER_ADMIN && currentUser != null && currentUser.getSociety() != null) {
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

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setPhone(request.getPhone());

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

        // Allow MASTER_ADMIN to update society assignment
        if (request.getSocietyId() != null && getCurrentUserRole() == Role.MASTER_ADMIN) {
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

        // For non-MASTER_ADMIN, verify same society
        User currentUser = getCurrentUser();
        if (currentRole != Role.MASTER_ADMIN && currentUser != null && currentUser.getSociety() != null) {
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
        // Use the method that eagerly loads the society to avoid lazy loading issues
        return userRepository.findByEmailWithSociety(auth.getName()).orElse(null);
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
        
        return response;
    }
}
