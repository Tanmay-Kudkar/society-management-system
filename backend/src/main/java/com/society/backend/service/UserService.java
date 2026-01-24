package com.society.backend.service;

import com.society.backend.dto.UserRequest;
import com.society.backend.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();
}
