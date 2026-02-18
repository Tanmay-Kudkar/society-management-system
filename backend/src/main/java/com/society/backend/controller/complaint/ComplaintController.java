package com.society.backend.controller.complaint;

import com.society.backend.dto.complaint.ComplaintRequest;
import com.society.backend.dto.complaint.ComplaintResponse;
import com.society.backend.service.complaint.ComplaintService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaints")
@PreAuthorize("isAuthenticated()")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final RoleService roleService;

    public ComplaintController(ComplaintService complaintService, RoleService roleService) {
        this.complaintService = complaintService;
        this.roleService = roleService;
    }

    // All registered users can raise complaints (MASTER_ADMIN to TENANT)
    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRequest request) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.create(userId, request));
    }

    // Only management can view all complaints
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAll(@RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getAll(userId));
    }

    // Users can view their own complaints, management can view anyone's
    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<ComplaintResponse>> getByUser(
            @PathVariable Long targetUserId,
            @RequestParam Long userId) {
        // User can view their own, or management can view anyone's
        if (!userId.equals(targetUserId)) {
            roleService.canManageComplaints(userId);
        }
        return ResponseEntity.ok(complaintService.getByUser(targetUserId));
    }

    // Management can filter by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getByStatus(status));
    }

    // Get complaints for a specific society
    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<ComplaintResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getById(id));
    }

    // Management can update status
    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String status,
            @RequestParam(required = false) String resolution) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.updateStatus(id, status, resolution));
    }

    // Management can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        complaintService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
