package com.society.backend.service.user;

import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();
}
