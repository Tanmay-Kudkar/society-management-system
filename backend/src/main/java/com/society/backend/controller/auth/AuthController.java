package com.society.backend.controller.auth;

import com.society.backend.dto.auth.*;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.service.auth.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.cookie.max-age:86400}")
    private int cookieMaxAge; // Default 24 hours

    @Value("${jwt.cookie.secure:false}")
    private boolean cookieSecure; // Set to true in production with HTTPS

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);

        // Set JWT in HTTP-only cookie
        Cookie jwtCookie = new Cookie("jwt", loginResponse.getToken());
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(cookieSecure);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(cookieMaxAge);
        jwtCookie.setAttribute("SameSite", "Lax");
        response.addCookie(jwtCookie);

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // Clear the JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(cookieSecure);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0); // Immediately expire
        response.addCookie(jwtCookie);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getUserFromToken(token));
    }
}
