package com.society.backend.controller.user;

import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;
import com.society.backend.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Create a new user. The current user can only create DIRECT CHILDREN roles.
     * HIERARCHY (Direct Children Only):
     * - MASTER_ADMIN → SOCIETY_ADMIN only
     * - SOCIETY_ADMIN → All below (exception: full CRUD)
     * - CHAIRMAN/SECRETARY/TREASURER → COMMITTEE only
     * - COMMITTEE → EMPLOYEE, MEMBER
     * - EMPLOYEE → VISITOR
     * - MEMBER → TENANT
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    /**
     * Get all users visible to the current user.
     * - MASTER_ADMIN sees all users
     * - Others see only users in their society
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER')")
    public List<UserResponse> getUsers() {
        return userService.getAllUsers();
    }

    /**
     * Get the roles that the current user is allowed to create.
     * Used by frontend to populate the role dropdown for creating users.
     */
    @GetMapping("/creatable-roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Set<String>> getCreatableRoles() {
        Set<Role> roles = userService.getCreatableRoles();
        Set<String> roleNames = roles.stream()
                .map(Role::name)
                .collect(Collectors.toSet());
        return ResponseEntity.ok(roleNames);
    }

    /**
     * Get the roles that the current user is allowed to update/delete.
     * Used by frontend to show/hide edit and delete buttons based on permissions.
     */
    @GetMapping("/updatable-roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Set<String>> getUpdatableRoles() {
        Set<Role> roles = userService.getUpdatableRoles();
        Set<String> roleNames = roles.stream()
                .map(Role::name)
                .collect(Collectors.toSet());
        return ResponseEntity.ok(roleNames);
    }

    /**
     * Get user by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Update an existing user.
     * Permission is checked in service layer based on role hierarchy.
     * Users can only update their direct children (except SOCIETY_ADMIN who can
     * update all).
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /**
     * Delete a user.
     * Permission is checked in service layer based on role hierarchy.
     * Users can only delete their direct children (except SOCIETY_ADMIN who can
     * delete all).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
