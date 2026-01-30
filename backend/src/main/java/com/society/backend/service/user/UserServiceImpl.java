package com.society.backend.service.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.complaint.ComplaintRepository;
import com.society.backend.repository.ticket.TicketRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.security.RolePermissions;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintRepository complaintRepository;
    private final TicketRepository ticketRepository;
    private final SocietyRepository societyRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ComplaintRepository complaintRepository, TicketRepository ticketRepository,
            SocietyRepository societyRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.complaintRepository = complaintRepository;
        this.ticketRepository = ticketRepository;
        this.societyRepository = societyRepository;
    }

    @Override
    public UserResponse createUser(UserRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
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

        User saved = userRepository.save(user);
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

        // SOCIETY_ADMIN and below see only users in their society
        if (currentUser != null && currentUser.getSociety() != null) {
            return userRepository.findBySocietyId(currentUser.getSociety().getId())
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        // No society assigned, return current user if available
        if (currentUser != null) {
            return List.of(mapToResponse(currentUser));
        }

        // No society assigned, return empty
        return List.of();
    }

    /**
     * Get the roles that the current user can create.
     */
    @Override
    public Set<Role> getCreatableRoles() {
        Role currentRole = getCurrentUserRole();
        return RolePermissions.getAllowedRolesToCreate(currentRole);
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
        if (request.getRole() != null) {
            user.setRole(resolveRole(request.getRole()));
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
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                user.getIsActive(),
                user.getSociety() != null ? user.getSociety().getId() : null,
                user.getSociety() != null ? user.getSociety().getName() : null);
    }
}
