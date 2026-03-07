package com.society.backend.user.service;

import com.society.backend.user.dto.response.BulkCreateUsersResponse;
import com.society.backend.user.dto.request.UserRequest;
import com.society.backend.user.dto.response.UserResponse;
import com.society.backend.user.entity.Role;

import java.util.List;
import java.util.Set;

import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();

    List<UserResponse> getUsersBySociety(Long societyId);

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UserRequest request);

    void deleteUser(Long id, boolean force);

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
