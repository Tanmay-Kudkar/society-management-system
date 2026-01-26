package com.society.backend.controller.complaint;

import com.society.backend.dto.complaint.ComplaintRequest;
import com.society.backend.dto.complaint.ComplaintResponse;
import com.society.backend.service.complaint.ComplaintService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final RoleService roleService;

    public ComplaintController(ComplaintService complaintService, RoleService roleService) {
        this.complaintService = complaintService;
        this.roleService = roleService;
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE, MEMBER can create (not VISITOR)
    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRequest request) {
        roleService.canCreateComplaint(userId);
        return ResponseEntity.ok(complaintService.create(userId, request));
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can view all complaints
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAll(@RequestParam Long userId) {
        roleService.canViewAll(userId);
        return ResponseEntity.ok(complaintService.getAll());
    }

    // Users can view their own complaints
    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<ComplaintResponse>> getByUser(
            @PathVariable Long targetUserId,
            @RequestParam Long userId) {
        // User can view their own, or staff can view anyone's
        if (!userId.equals(targetUserId)) {
            roleService.canViewAll(userId);
        }
        return ResponseEntity.ok(complaintService.getByUser(targetUserId));
    }

    // MASTER_ADMIN, COMMITTEE, EMPLOYEE can filter by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.canViewAll(userId);
        return ResponseEntity.ok(complaintService.getByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getById(id));
    }

    // MASTER_ADMIN, COMMITTEE can update status
    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String status) {
        roleService.canUpdateComplaintStatus(userId);
        return ResponseEntity.ok(complaintService.updateStatus(id, status));
    }

    // MASTER_ADMIN, COMMITTEE can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canUpdateComplaintStatus(userId);
        complaintService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
