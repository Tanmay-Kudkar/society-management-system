package com.society.backend.controller.workorder;

import com.society.backend.dto.workorder.WorkOrderRequest;
import com.society.backend.dto.workorder.WorkOrderResponse;
import com.society.backend.service.workorder.WorkOrderService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/work-orders")
@PreAuthorize("isAuthenticated()")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final RoleService roleService;

    public WorkOrderController(WorkOrderService workOrderService, RoleService roleService) {
        this.workOrderService = workOrderService;
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<WorkOrderResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody WorkOrderRequest request) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.create(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<WorkOrderResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<WorkOrderResponse>> getByStatus(
            @PathVariable Long societyId,
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getByStatus(societyId, status));
    }

    @GetMapping("/society/{societyId}/category/{category}")
    public ResponseEntity<List<WorkOrderResponse>> getByCategory(
            @PathVariable Long societyId,
            @PathVariable String category,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getByCategory(societyId, category));
    }

    @GetMapping("/society/{societyId}/priority/{priority}")
    public ResponseEntity<List<WorkOrderResponse>> getByPriority(
            @PathVariable Long societyId,
            @PathVariable String priority,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getByPriority(societyId, priority));
    }

    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<List<WorkOrderResponse>> getByAssignee(
            @PathVariable Long assigneeId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getByAssignee(assigneeId));
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<WorkOrderResponse>> getByRequester(
            @PathVariable Long requesterId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getByRequester(requesterId));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<WorkOrderResponse> assign(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam Long assignedToId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(workOrderService.assign(id, assignedToId));
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<WorkOrderResponse> startWork(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(workOrderService.startWork(id));
    }

    @PatchMapping("/{id}/hold")
    public ResponseEntity<WorkOrderResponse> putOnHold(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String notes) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(workOrderService.putOnHold(id, notes));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<WorkOrderResponse> complete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String resolutionNotes,
            @RequestParam(required = false) BigDecimal actualCost) {
        roleService.requireStaff(userId);
        return ResponseEntity.ok(workOrderService.complete(id, resolutionNotes, actualCost));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<WorkOrderResponse> cancel(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String reason) {
        roleService.requireAdminOrCommittee(userId);
        return ResponseEntity.ok(workOrderService.cancel(id, reason));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.requireMember(userId);
        return ResponseEntity.ok(workOrderService.getCounts(societyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.requireAdminOrCommittee(userId);
        workOrderService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
