package com.society.backend.controller.user;

import com.society.backend.dto.user.BulkCreateUsersResponse;
import com.society.backend.dto.user.BulkUserImportResponse;
import com.society.backend.dto.user.UserImportRow;
import com.society.backend.dto.user.UserRequest;
import com.society.backend.dto.user.UserResponse;
import com.society.backend.entity.Role;
import com.society.backend.service.user.BulkUserImportService;
import com.society.backend.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final BulkUserImportService bulkUserImportService;

    public UserController(UserService userService, BulkUserImportService bulkUserImportService) {
        this.userService = userService;
        this.bulkUserImportService = bulkUserImportService;
    }

    /**
     * Create a new user. The current user can only create DIRECT CHILDREN roles.
     * PERMISSION MATRIX (Direct Children Only):
     * - MASTER_ADMIN → SOCIETY_ADMIN, SOCIETY_ADMIN
     * - SOCIETY_ADMIN → SOCIETY_ADMIN
     * - SOCIETY_ADMIN → ALL below (full access)
     * - CHAIRMAN → SECRETARY, TREASURER
     * - SECRETARY → COMMITTEE only
     * - TREASURER → COMMITTEE only
     * - COMMITTEE → EMPLOYEE, MEMBER
     * - EMPLOYEE → VISITOR
     * - MEMBER → TENANT
     * Note: MANAGER has NO user creation rights
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
     * - SOCIETY_ADMIN sees users in their organization's societies
     * - Others see only users in their society
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER')")
    public List<UserResponse> getUsers() {
        return userService.getAllUsers();
    }

    /**
     * Get all users for a specific society.
     * MASTER_ADMIN and SOCIETY_ADMIN can use this endpoint.
     */
    @GetMapping("/society/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN')")
    public List<UserResponse> getUsersBySociety(@PathVariable Long societyId) {
        return userService.getUsersBySociety(societyId);
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
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER')")
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
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force) {
        userService.deleteUser(id, force);
        return ResponseEntity.noContent().build();
    }

    /**
     * Bulk create users for all units in a society that don't have users.
     * Uses owner email as username and flat number as default password.
     * SOCIETY_ADMIN has full access. COMMITTEE can create EMPLOYEE/MEMBER.
     * SECRETARY/TREASURER can create COMMITTEE. CHAIRMAN can create
     * SECRETARY/TREASURER.
     */
    @PostMapping("/bulk-create/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
    public ResponseEntity<BulkCreateUsersResponse> bulkCreateUsers(@PathVariable Long societyId) {
        return ResponseEntity.ok(userService.bulkCreateUsersForUnits(societyId));
    }

    /**
     * Validate bulk user import from Excel file.
     * Returns parsed data with validation status for preview before actual import.
     * Roles that can create users may bulk import.
     */
    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
    public ResponseEntity<BulkUserImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {

        // Parse and validate the Excel file
        List<UserImportRow> rows = bulkUserImportService.parseExcelFile(file);
        BulkUserImportResponse response = bulkUserImportService.validateImportRows(rows, societyId);

        return ResponseEntity.ok(response);
    }

    /**
     * Process bulk user import from Excel file.
     * Creates users from previously validated data.
     * Roles that can create users may bulk import.
     */
    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
    public ResponseEntity<BulkUserImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {

        // Parse, validate, and process the Excel file
        List<UserImportRow> rows = bulkUserImportService.parseExcelFile(file);
        BulkUserImportResponse validationResponse = bulkUserImportService.validateImportRows(rows, societyId);

        // Only process if there are no validation errors
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }

        // Process the import
        BulkUserImportResponse processResponse = bulkUserImportService.processImport(rows, societyId);

        return ResponseEntity.ok(processResponse);
    }

    /**
     * Download Excel template for bulk user import.
     */
    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkUserImportService.generateTemplate();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=user_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
