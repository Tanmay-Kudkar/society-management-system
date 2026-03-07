package com.society.backend.ticket.controller;

import com.society.backend.ticket.dto.request.*;
import com.society.backend.ticket.dto.response.*;
import com.society.backend.ticket.service.ApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ApprovalController {

    private final ApprovalService approvalService;

    // ===== WORKFLOW ENDPOINTS =====

    @PostMapping("/workflows")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER')")
    public ResponseEntity<ApprovalWorkflowResponse> createWorkflow(
            @Valid @RequestBody ApprovalWorkflowRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalService.createWorkflow(request, userId));
    }

    @GetMapping("/workflows/{id}")
    public ResponseEntity<ApprovalWorkflowResponse> getWorkflowById(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.getWorkflowById(id));
    }

    @GetMapping("/workflows/society/{societyId}")
    public ResponseEntity<List<ApprovalWorkflowResponse>> getWorkflowsBySociety(
            @PathVariable Long societyId) {
        return ResponseEntity.ok(approvalService.getWorkflowsBySociety(societyId));
    }

    @GetMapping("/workflows/society/{societyId}/type/{entityType}")
    public ResponseEntity<List<ApprovalWorkflowResponse>> getWorkflowsBySocietyAndType(
            @PathVariable Long societyId, @PathVariable String entityType) {
        return ResponseEntity.ok(approvalService.getWorkflowsBySocietyAndType(societyId, entityType));
    }

    @PutMapping("/workflows/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER')")
    public ResponseEntity<ApprovalWorkflowResponse> updateWorkflow(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalWorkflowRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(approvalService.updateWorkflow(id, request, userId));
    }

    @DeleteMapping("/workflows/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER')")
    public ResponseEntity<Void> deleteWorkflow(@PathVariable Long id, @RequestParam Long userId) {
        approvalService.deleteWorkflow(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ===== APPROVAL REQUEST ENDPOINTS =====

    @PostMapping("/requests")
    public ResponseEntity<ApprovalRequestResponse> createRequest(
            @Valid @RequestBody ApprovalRequestCreateDTO request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalService.createRequest(request, userId));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<ApprovalRequestResponse> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.getRequestById(id));
    }

    @GetMapping("/requests/society/{societyId}")
    public ResponseEntity<List<ApprovalRequestResponse>> getRequestsBySociety(
            @PathVariable Long societyId) {
        return ResponseEntity.ok(approvalService.getRequestsBySociety(societyId));
    }

    @GetMapping("/requests/society/{societyId}/status/{status}")
    public ResponseEntity<List<ApprovalRequestResponse>> getRequestsByStatus(
            @PathVariable Long societyId, @PathVariable String status) {
        return ResponseEntity.ok(approvalService.getRequestsByStatus(societyId, status));
    }

    @GetMapping("/requests/society/{societyId}/type/{entityType}")
    public ResponseEntity<List<ApprovalRequestResponse>> getRequestsByEntityType(
            @PathVariable Long societyId, @PathVariable String entityType) {
        return ResponseEntity.ok(approvalService.getRequestsByEntityType(societyId, entityType));
    }

    @GetMapping("/requests/user/{userId}")
    public ResponseEntity<List<ApprovalRequestResponse>> getRequestsByUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(approvalService.getRequestsByUser(userId));
    }

    @GetMapping("/requests/pending/{societyId}")
    public ResponseEntity<List<ApprovalRequestResponse>> getPendingForApprover(
            @PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(approvalService.getPendingForApprover(societyId, userId));
    }

    // ===== ACTION ENDPOINTS =====

    @PostMapping("/requests/{requestId}/action")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER','COMMITTEE','MANAGER')")
    public ResponseEntity<ApprovalRequestResponse> takeAction(
            @PathVariable Long requestId,
            @Valid @RequestBody ApprovalActionRequest action,
            @RequestParam Long userId) {
        return ResponseEntity.ok(approvalService.takeAction(requestId, action, userId));
    }

    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<ApprovalRequestResponse> cancelRequest(
            @PathVariable Long requestId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(approvalService.cancelRequest(requestId, userId));
    }
}
