package com.society.backend.controller.asset;

import com.society.backend.society.dto.AssetRequest;
import com.society.backend.society.dto.AssetResponse;
import com.society.backend.society.service.AssetService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assets")
@PreAuthorize("isAuthenticated()")
public class AssetController {

    private final AssetService assetService;
    private final RoleService roleService;

    public AssetController(AssetService assetService, RoleService roleService) {
        this.assetService = assetService;
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<AssetResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody AssetRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody AssetRequest request) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.update(id, userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(assetService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<AssetResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(assetService.getBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<AssetResponse>> getByStatus(
            @PathVariable Long societyId,
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(assetService.getByStatus(societyId, status));
    }

    @GetMapping("/society/{societyId}/category/{category}")
    public ResponseEntity<List<AssetResponse>> getByCategory(
            @PathVariable Long societyId,
            @PathVariable String category,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(assetService.getByCategory(societyId, category));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AssetResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String status) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<AssetResponse> assign(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam Long assignedToId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.assign(id, assignedToId));
    }

    @PatchMapping("/{id}/unassign")
    public ResponseEntity<AssetResponse> unassign(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.unassign(id));
    }

    @GetMapping("/society/{societyId}/low-stock")
    public ResponseEntity<List<AssetResponse>> getLowStock(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(assetService.getLowStock(societyId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(assetService.getCounts(societyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        assetService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
