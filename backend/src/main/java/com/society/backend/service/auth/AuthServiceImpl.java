package com.society.backend.service.auth;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
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

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        Role role = resolveRole(request.getRole());

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
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

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name());
    }

    private Role resolveRole(String roleValue) {
        if (roleValue == null || roleValue.trim().isEmpty()) {
            return Role.MEMBER;
        }
        try {
            return Role.valueOf(roleValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
    }
}
