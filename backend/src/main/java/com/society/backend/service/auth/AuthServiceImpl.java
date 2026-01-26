package com.society.backend.service.auth;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.society.backend.dto.auth.LoginRequest;
import com.society.backend.dto.auth.LoginResponse;
import com.society.backend.dto.auth.RegisterRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.security.JwtUtils;
import com.society.backend.security.RolePermissions;

/**
 * Auth service handles login and public self-registration.
 * 
 * IMPORTANT: Public registration is restricted!
 * - Only MEMBER role can self-register (residents joining a society)
 * - All other roles must be created by authorized users through /users endpoint
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
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
                    "Only MEMBER role can self-register. Contact your Society Admin for other roles."
            );
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

        // Generate JWT token
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                token);
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
}
