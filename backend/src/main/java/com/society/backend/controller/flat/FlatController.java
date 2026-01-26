package com.society.backend.controller.flat;

import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;
import com.society.backend.service.flat.FlatService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flats")
public class FlatController {

    private final FlatService flatService;
    private final RoleService roleService;

    public FlatController(FlatService flatService, RoleService roleService) {
        this.flatService = flatService;
        this.roleService = roleService;
    }

    // MASTER_ADMIN, COMMITTEE only
    @PostMapping
    public ResponseEntity<FlatResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody FlatRequest request) {
        roleService.canManageFlats(userId);
        return ResponseEntity.ok(flatService.create(request));
    }

    // All authenticated users can view
    @GetMapping
    public ResponseEntity<List<FlatResponse>> getAll() {
        return ResponseEntity.ok(flatService.getAll());
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<FlatResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(flatService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlatResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(flatService.getById(id));
    }

    // MASTER_ADMIN, COMMITTEE only
    @PutMapping("/{id}")
    public ResponseEntity<FlatResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody FlatRequest request) {
        roleService.canManageFlats(userId);
        return ResponseEntity.ok(flatService.update(id, request));
    }

    // MASTER_ADMIN, COMMITTEE only
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageFlats(userId);
        flatService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
