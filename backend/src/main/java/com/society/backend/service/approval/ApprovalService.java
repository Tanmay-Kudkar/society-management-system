package com.society.backend.service.approval;

import com.society.backend.dto.approval.*;

import java.util.List;

public interface ApprovalService {

    // Workflow CRUD
    ApprovalWorkflowResponse createWorkflow(ApprovalWorkflowRequest request, Long userId);
    ApprovalWorkflowResponse getWorkflowById(Long id);
    List<ApprovalWorkflowResponse> getWorkflowsBySociety(Long societyId);
    List<ApprovalWorkflowResponse> getWorkflowsBySocietyAndType(Long societyId, String entityType);
    ApprovalWorkflowResponse updateWorkflow(Long id, ApprovalWorkflowRequest request, Long userId);
    void deleteWorkflow(Long id, Long userId);

    // Approval Request lifecycle
    ApprovalRequestResponse createRequest(ApprovalRequestCreateDTO request, Long userId);
    ApprovalRequestResponse getRequestById(Long id);
    List<ApprovalRequestResponse> getRequestsBySociety(Long societyId);
    List<ApprovalRequestResponse> getRequestsByStatus(Long societyId, String status);
    List<ApprovalRequestResponse> getRequestsByEntityType(Long societyId, String entityType);
    List<ApprovalRequestResponse> getRequestsByUser(Long userId);
    List<ApprovalRequestResponse> getPendingForApprover(Long societyId, Long userId);

    // Actions
    ApprovalRequestResponse takeAction(Long requestId, ApprovalActionRequest action, Long userId);
    ApprovalRequestResponse cancelRequest(Long requestId, Long userId);
}
