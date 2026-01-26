package com.society.backend.controller.user;

import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping
    public List<UserResponse> getUsers() {
        return userService.getAllUsers();
    }
}
