package com.society.backend.service.auth;

import com.society.backend.dto.auth.LoginRequest;
import com.society.backend.dto.auth.LoginResponse;
import com.society.backend.dto.auth.RegisterRequest;
import com.society.backend.dto.user.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);
}
