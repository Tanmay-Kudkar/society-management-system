package com.society.backend.controller;
import com.society.backend.dto.LoginRequest;
import com.society.backend.dto.LoginResponse;
import com.society.backend.entity.User;
import com.society.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping(
        value = "/auth",
        produces = "application/json"
)

public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping(
            value = "/login",
            consumes = "application/json",
            produces = "application/json"
    )

    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request)
    {

        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {
            return ResponseEntity.status(401).build();
        }

        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return ResponseEntity.ok(response);
    }
}
