package com.society.backend.auth.service;

import com.society.backend.auth.dto.request.LoginRequest;
import com.society.backend.auth.dto.response.LoginResponse;
import com.society.backend.auth.dto.request.RegisterRequest;
import com.society.backend.user.dto.response.UserResponse;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request, HttpServletRequest httpRequest);

    void recordLogout(String token, HttpServletRequest httpRequest);

    UserResponse getUserFromToken(String token);

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);

    void changePassword(Long userId, String currentPassword, String newPassword);
}
