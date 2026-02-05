package com.society.backend.service.user;

import com.society.backend.dto.user.BulkCreateUsersResponse;
import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;

import java.util.List;
import java.util.Set;

public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();

    List<UserResponse> getUsersBySociety(Long societyId);

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UserRequest request);

    void deleteUser(Long id);

    /**
     * Get the roles that the current user can create.
     */
    Set<Role> getCreatableRoles();

    /**
     * Get the roles that the current user can update/delete.
     */
    Set<Role> getUpdatableRoles();
    
    /**
     * Bulk create users for all units in a society that don't have users.
     * Uses flat number as default password and generates email from owner info.
     */
    BulkCreateUsersResponse bulkCreateUsersForUnits(Long societyId);
}
