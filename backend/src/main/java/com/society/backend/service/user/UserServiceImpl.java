package com.society.backend.service.user;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.user.UserRepository;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse createUser(UserRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(resolveRole(request.getRole()));
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return mapToResponse(saved);
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

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name());
    }
}
