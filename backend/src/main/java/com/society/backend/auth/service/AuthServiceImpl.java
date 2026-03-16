package com.society.backend.auth.service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import com.society.backend.auth.dto.request.LoginRequest;
import com.society.backend.auth.dto.request.LogoutRequest;
import com.society.backend.auth.dto.response.LoginResponse;
import com.society.backend.auth.dto.request.RegisterRequest;
import com.society.backend.user.dto.response.UserResponse;
import com.society.backend.auth.entity.PasswordResetToken;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.auth.repository.PasswordResetTokenRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.security.JwtUtils;
import com.society.backend.common.security.RolePermissions;
import com.society.backend.common.service.EmailService;
import com.society.backend.auth.entity.LoginAudit;
import com.society.backend.auth.repository.LoginAuditRepository;
import com.society.backend.society.entity.Society;
import com.society.backend.society.repository.SocietyRepository;
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
    private final SocietyRepository societyRepository;
    private final LoginAuditRepository loginAuditRepository;

    @Value("${auth.society-admin.proximity-threshold-meters:300}")
    private double societyAdminProximityThresholdMeters;

    // Portal → allowed roles mapping
    private static final Set<Role> ADMIN_ROLES = Set.of(
            Role.MASTER_ADMIN, Role.SOCIETY_ADMIN);
    private static final Set<Role> MANAGEMENT_ROLES = Set.of(
            Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
            Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE);
    private static final Set<Role> RESIDENT_ROLES = Set.of(
            Role.MEMBER, Role.TENANT);
    // VISITOR_ROLES removed — visitors cannot log in (README §4.9)

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository resetTokenRepository,
            EmailService emailService,
            SocietyRepository societyRepository,
            LoginAuditRepository loginAuditRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
        this.societyRepository = societyRepository;
        this.loginAuditRepository = loginAuditRepository;
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

        // Link to society if provided
        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Society not found"));
            user.setSociety(society);
        }

        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole().name());
    }

    @Override
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {

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

        // VISITOR role cannot log in directly (README §4.9: entries created by security)
        if (user.getRole() == Role.VISITOR) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Visitors do not have direct system access. Contact society security.");
        }

        // Validate portal type against user role (if provided)
        validatePortalAccess(request.getPortalType(), user.getRole());

        if (isSocietyAdminRole(user.getRole())
            && (request.getLatitude() == null || request.getLongitude() == null)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Location is required for Society Admin login. Enable location permission or set pin manually.");
        }

        // Generate JWT token (longer expiry if remember me)
        boolean rememberMe = request.isRememberMe();
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId(), rememberMe);

        // Get societyId if user belongs to a society
        Long societyId = user.getSociety() != null ? user.getSociety().getId() : null;
        // Get flatId if user has a flat assigned
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;

        // Record login audit only for SOCIETY_ADMIN sessions.
        if (isSocietyAdminRole(user.getRole())) {
            try {
                String ip = extractIpAddress(httpRequest);
                String ua = httpRequest.getHeader("User-Agent");
                loginAuditRepository.save(buildAuditEntry(
                        user,
                        LoginAudit.Action.LOGIN,
                        ip,
                        ua,
                        request.getLatitude(),
                        request.getLongitude()));
            } catch (Exception e) {
                logger.warn("Failed to record login audit for user {}: {}", user.getId(), e.getMessage());
            }
        }

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getAccountType(),
                societyId,
                flatId,
                token);
    }

    @Override
    public void recordLogout(String token, HttpServletRequest httpRequest, LogoutRequest logoutRequest) {
        if (token == null || !jwtUtils.validateToken(token)) {
            return; // Nothing to audit if token is invalid
        }
        try {
            String email = jwtUtils.getEmailFromToken(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null && isSocietyAdminRole(user.getRole())) {
                String ip = extractIpAddress(httpRequest);
                String ua = httpRequest.getHeader("User-Agent");
                Double latitude = logoutRequest != null ? logoutRequest.getLatitude() : null;
                Double longitude = logoutRequest != null ? logoutRequest.getLongitude() : null;
                loginAuditRepository.save(buildAuditEntry(
                        user,
                        LoginAudit.Action.LOGOUT,
                        ip,
                        ua,
                        latitude,
                        longitude));
            }
        } catch (Exception e) {
            logger.warn("Failed to record logout audit: {}", e.getMessage());
        }
    }

    private LoginAudit buildAuditEntry(User user,
                                       LoginAudit.Action action,
                                       String ip,
                                       String userAgent,
                                       Double latitude,
                                       Double longitude) {
        if (!isSocietyAdminRole(user.getRole()) || latitude == null || longitude == null) {
            return new LoginAudit(user, action, ip, userAgent, latitude, longitude);
        }

        Optional<LoginAudit> previousLogin = loginAuditRepository
                .findTopByUserIdAndActionAndLatitudeIsNotNullAndLongitudeIsNotNullOrderByTimestampDesc(
                        user.getId(),
                        LoginAudit.Action.LOGIN);

        if (previousLogin.isEmpty()) {
            return new LoginAudit(
                    user,
                    action,
                    ip,
                    userAgent,
                    latitude,
                    longitude,
                    true,
                    0.0,
                    societyAdminProximityThresholdMeters);
        }

        LoginAudit anchor = previousLogin.get();
        double distanceMeters = haversineMeters(
                latitude,
                longitude,
                anchor.getLatitude(),
                anchor.getLongitude());

        boolean isNearby = distanceMeters <= societyAdminProximityThresholdMeters;
        return new LoginAudit(
                user,
                action,
                ip,
                userAgent,
                latitude,
                longitude,
                isNearby,
                distanceMeters,
                societyAdminProximityThresholdMeters);
    }

    @Override
    @Transactional
    public void updateCurrentLocation(Long userId, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) return;

        loginAuditRepository
                .findTopByUserIdAndActionOrderByTimestampDesc(userId, LoginAudit.Action.LOGIN)
                .ifPresent(current -> {
                    current.setLatitude(latitude);
                    current.setLongitude(longitude);

                    // Recalculate proximity against the previous LOGIN location
                    loginAuditRepository
                            .findTopByUserIdAndActionAndLatitudeIsNotNullAndLongitudeIsNotNullOrderByTimestampDesc(
                                    userId, LoginAudit.Action.LOGIN)
                            .filter(prev -> !prev.getId().equals(current.getId()))
                            .ifPresentOrElse(prev -> {
                                double dist = haversineMeters(latitude, longitude,
                                        prev.getLatitude(), prev.getLongitude());
                                current.setDistanceMeters(dist);
                                current.setIsNearby(dist <= societyAdminProximityThresholdMeters);
                                current.setProximityThresholdMeters(societyAdminProximityThresholdMeters);
                            }, () -> {
                                // First location-bearing LOGIN acts as baseline and is treated as nearby.
                                current.setDistanceMeters(0.0);
                                current.setIsNearby(true);
                                current.setProximityThresholdMeters(societyAdminProximityThresholdMeters);
                            });

                    loginAuditRepository.save(current);
                });
    }

    private boolean isSocietyAdminRole(Role role) {
        return role == Role.SOCIETY_ADMIN;
    }

    private double haversineMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
        final double earthRadiusMeters = 6371000.0;

        double latDistance = Math.toRadians(latitude2 - latitude1);
        double lonDistance = Math.toRadians(longitude2 - longitude1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(latitude1))
                * Math.cos(Math.toRadians(latitude2))
                * Math.sin(lonDistance / 2)
                * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    @Override
    public UserResponse getUserFromToken(String token) {
        if (!jwtUtils.validateToken(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        String email = jwtUtils.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        Long societyId = user.getSociety() != null ? user.getSociety().getId() : null;
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                societyId);
        response.setAccountType(user.getAccountType());
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

    private String extractIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        // On localhost, getRemoteAddr() returns loopback — resolve the actual LAN IP
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "127.0.0.1".equals(ip)) {
            try {
                return java.net.InetAddress.getLocalHost().getHostAddress();
            } catch (Exception e) {
                return "127.0.0.1";
            }
        }
        return ip;
    }
}
