package com.society.backend.auth.service;

import com.society.backend.auth.dto.LoginRequest;
import com.society.backend.auth.dto.LoginResponse;
import com.society.backend.auth.dto.RegisterRequest;
import com.society.backend.user.dto.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    UserResponse getUserFromToken(String token);

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);

    void changePassword(Long userId, String currentPassword, String newPassword);
}
