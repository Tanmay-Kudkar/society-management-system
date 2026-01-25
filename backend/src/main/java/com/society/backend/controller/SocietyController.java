package com.society.backend.controller;

import com.society.backend.dto.SocietyRequest;
import com.society.backend.dto.SocietyResponse;
import com.society.backend.service.RoleService;
import com.society.backend.service.SocietyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/societies")
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
            @RequestParam Long userId) {
        roleService.canManageSocieties(userId);
        societyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
