package com.society.backend.controller.society;

import com.society.backend.dto.society.SocietyRequest;
import com.society.backend.dto.society.SocietyResponse;
import com.society.backend.service.common.RoleService;
import com.society.backend.service.society.SocietyService;
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

    // PLATFORM_OWNER only
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

    @GetMapping("/by-organization/{organizationId}")
    public ResponseEntity<List<SocietyResponse>> getByOrganizationId(@PathVariable Long organizationId) {
        return ResponseEntity.ok(societyService.getByOrganizationId(organizationId));
    }

    // PLATFORM_OWNER only
    @PutMapping("/{id}")
    public ResponseEntity<SocietyResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody SocietyRequest request) {
        roleService.canManageSocieties(userId);
        return ResponseEntity.ok(societyService.update(id, request));
    }

    // PLATFORM_OWNER only
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageSocieties(userId);
        societyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
