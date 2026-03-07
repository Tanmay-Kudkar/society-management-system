package com.society.backend.society.controller;

import com.society.backend.society.dto.request.SocietyRequest;
import com.society.backend.society.dto.response.SocietyResponse;
import com.society.backend.common.service.RoleService;
import com.society.backend.society.service.SocietyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/societies")
@PreAuthorize("isAuthenticated()")
public class SocietyController {

    private final SocietyService societyService;
    private final RoleService roleService;

    public SocietyController(SocietyService societyService, RoleService roleService) {
        this.societyService = societyService;
        this.roleService = roleService;
    }

    // MASTER_ADMIN only
    @PostMapping
    public ResponseEntity<SocietyResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody SocietyRequest request) {
        roleService.canManageSocieties(userId);
        return ResponseEntity.ok(societyService.create(request));
    }

    // All authenticated users can view
    @GetMapping
    public ResponseEntity<List<SocietyResponse>> getAll() {
        return ResponseEntity.ok(societyService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocietyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(societyService.getById(id));
    }

    // MASTER_ADMIN only
    @PutMapping("/{id}")
    public ResponseEntity<SocietyResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody SocietyRequest request) {
        roleService.canManageSocieties(userId);
        return ResponseEntity.ok(societyService.update(id, request));
    }

    // MASTER_ADMIN only
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean force) {
        roleService.canManageSocieties(userId);
        societyService.delete(id, force);
        return ResponseEntity.noContent().build();
    }
}
