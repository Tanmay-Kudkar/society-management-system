package com.society.backend.service;

import com.society.backend.dto.LoginRequest;
import com.society.backend.dto.LoginResponse;
import com.society.backend.dto.RegisterRequest;
import com.society.backend.dto.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserResponse register(RegisterRequest request);
}
