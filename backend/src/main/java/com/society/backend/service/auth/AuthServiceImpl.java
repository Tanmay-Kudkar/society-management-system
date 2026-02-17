package com.society.backend.service.auth;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.society.backend.dto.auth.LoginRequest;
import com.society.backend.dto.auth.LoginResponse;
import com.society.backend.dto.auth.RegisterRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.PasswordResetToken;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.PasswordResetTokenRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.security.JwtUtils;
import com.society.backend.security.RolePermissions;
import com.society.backend.service.common.EmailService;

/**
 * Auth service handles login and public self-registration.
 * 
 * IMPORTANT: Public registration is restricted!
 * - Only MEMBER role can self-register (residents joining a society)
 * - All other roles must be created by authorized users through /users endpoint
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;

    // Portal → allowed roles mapping
    private static final Set<Role> ADMIN_ROLES = Set.of(
            Role.PLATFORM_OWNER, Role.ORGANIZATION_OWNER, Role.SOCIETY_ADMIN);
    private static final Set<Role> MANAGEMENT_ROLES = Set.of(
            Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
            Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE);
    private static final Set<Role> RESIDENT_ROLES = Set.of(
            Role.MEMBER, Role.TENANT);
    private static final Set<Role> VISITOR_ROLES = Set.of(
            Role.VISITOR);

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository resetTokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
    }

    @Override
    public UserResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        Role role = resolveRole(request.getRole());

        // Only MEMBER can self-register through public registration
        if (!RolePermissions.canSelfRegister(role)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only MEMBER role can self-register. Contact your Society Admin for other roles.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole().name());
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        // Authenticate user credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        // Check if user is active
        if (user.getIsActive() == null || !user.getIsActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is disabled. Contact your administrator.");
        }

        // Validate portal type against user role (if provided)
        validatePortalAccess(request.getPortalType(), user.getRole());

        // Generate JWT token (longer expiry if remember me)
        boolean rememberMe = request.isRememberMe();
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId(), rememberMe);

        // Get organizationId if user belongs to an organization
        Long organizationId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        // Get societyId if user belongs to a society
        Long societyId = user.getSociety() != null ? user.getSociety().getId() : null;
        // Get flatId if user has a flat assigned
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getAccountType(),
                organizationId,
                societyId,
                flatId,
                token);
    }

    @Override
    public UserResponse getUserFromToken(String token) {
        if (!jwtUtils.validateToken(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        String email = jwtUtils.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        Long organizationId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        Long societyId = user.getSociety() != null ? user.getSociety().getId() : null;
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                societyId);
        response.setAccountType(user.getAccountType());
        response.setOrganizationId(organizationId);
        response.setFlatId(flatId);

        return response;
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        // Always return success to avoid email enumeration attacks
        if (user == null || (user.getIsActive() != null && !user.getIsActive())) {
            return;
        }

        // Delete any existing reset tokens for this user
        resetTokenRepository.deleteByUser(user);

        // Generate reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(
                token,
                user,
                LocalDateTime.now().plusMinutes(30) // 30-minute expiry
        );
        resetTokenRepository.save(resetToken);

        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
            // Don't expose email sending failures to the user
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Invalid or expired reset link. Please request a new password reset."));

        if (resetToken.isExpired()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "This reset link has expired. Please request a new password reset.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
    }

    private void validatePortalAccess(String portalType, Role userRole) {
        if (portalType == null || portalType.isBlank()) {
            return; // No portal selected, allow any role (backward compatible)
        }

        Set<Role> allowedRoles = switch (portalType.toLowerCase().trim()) {
            case "admin" -> ADMIN_ROLES;
            case "management" -> MANAGEMENT_ROLES;
            case "resident" -> RESIDENT_ROLES;
            case "visitor" -> VISITOR_ROLES;
            default -> null;
        };

        if (allowedRoles != null && !allowedRoles.contains(userRole)) {
            String portalLabel = portalType.substring(0, 1).toUpperCase() + portalType.substring(1).toLowerCase();
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Your account doesn't have " + portalLabel + " portal access. Please select the correct portal.");
        }
    }

    private Role resolveRole(String roleValue) {
        if (roleValue == null || roleValue.trim().isEmpty()) {
            return Role.MEMBER; // Default to MEMBER for self-registration
        }
        try {
            return Role.valueOf(roleValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
