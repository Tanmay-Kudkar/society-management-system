package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.*;
import com.society.backend.entity.*;
import com.society.backend.exception.ApiException;
import com.society.backend.ticket.repository.ApprovalActionRepository;
import com.society.backend.ticket.repository.ApprovalRequestRepository;
import com.society.backend.ticket.repository.ApprovalWorkflowRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalWorkflowRepository workflowRepository;
    private final ApprovalRequestRepository requestRepository;
    private final ApprovalActionRepository actionRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    // ===== WORKFLOW CRUD =====

    @Override
    @Transactional
    public ApprovalWorkflowResponse createWorkflow(ApprovalWorkflowRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        User user = roleService.getUser(userId);
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(user, society.getId());

        ApprovalWorkflow workflow = new ApprovalWorkflow();
        workflow.setSociety(society);
        workflow.setName(request.getName());
        workflow.setEntityType(request.getEntityType());
        workflow.setDescription(request.getDescription());
        workflow.setMinAmount(request.getMinAmount());
        workflow.setMaxAmount(request.getMaxAmount());
        workflow.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        workflow.setCreatedBy(user);

        if (request.getSteps() != null && !request.getSteps().isEmpty()) {
            for (WorkflowStepRequest stepReq : request.getSteps()) {
                ApprovalWorkflowStep step = new ApprovalWorkflowStep();
                step.setWorkflow(workflow);
                step.setStepOrder(stepReq.getStepOrder());
                step.setApproverRole(stepReq.getApproverRole());
                step.setIsMandatory(stepReq.getIsMandatory() != null ? stepReq.getIsMandatory() : true);
                step.setAutoApproveBelow(stepReq.getAutoApproveBelow());
                workflow.getSteps().add(step);
            }
        }

        ApprovalWorkflow saved = workflowRepository.save(workflow);
        return mapWorkflowToResponse(saved);
    }

    @Override
    public ApprovalWorkflowResponse getWorkflowById(Long id) {
        ApprovalWorkflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval workflow not found"));
        return mapWorkflowToResponse(workflow);
    }

    @Override
    public List<ApprovalWorkflowResponse> getWorkflowsBySociety(Long societyId) {
        return workflowRepository.findBySocietyId(societyId).stream()
                .map(this::mapWorkflowToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ApprovalWorkflowResponse> getWorkflowsBySocietyAndType(Long societyId, String entityType) {
        return workflowRepository.findBySocietyIdAndEntityType(societyId, entityType).stream()
                .map(this::mapWorkflowToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApprovalWorkflowResponse updateWorkflow(Long id, ApprovalWorkflowRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        User user = roleService.getUser(userId);

        ApprovalWorkflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval workflow not found"));
        roleService.enforceSocietyScope(user, workflow.getSociety().getId());

        workflow.setName(request.getName());
        workflow.setEntityType(request.getEntityType());
        workflow.setDescription(request.getDescription());
        workflow.setMinAmount(request.getMinAmount());
        workflow.setMaxAmount(request.getMaxAmount());
        if (request.getIsActive() != null) {
            workflow.setIsActive(request.getIsActive());
        }

        // Replace steps
        workflow.getSteps().clear();
        if (request.getSteps() != null) {
            for (WorkflowStepRequest stepReq : request.getSteps()) {
                ApprovalWorkflowStep step = new ApprovalWorkflowStep();
                step.setWorkflow(workflow);
                step.setStepOrder(stepReq.getStepOrder());
                step.setApproverRole(stepReq.getApproverRole());
                step.setIsMandatory(stepReq.getIsMandatory() != null ? stepReq.getIsMandatory() : true);
                step.setAutoApproveBelow(stepReq.getAutoApproveBelow());
                workflow.getSteps().add(step);
            }
        }

        ApprovalWorkflow saved = workflowRepository.save(workflow);
        return mapWorkflowToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteWorkflow(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        User user = roleService.getUser(userId);

        ApprovalWorkflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval workflow not found"));
        roleService.enforceSocietyScope(user, workflow.getSociety().getId());

        workflowRepository.delete(workflow);
    }

    // ===== APPROVAL REQUEST LIFECYCLE =====

    @Override
    @Transactional
    public ApprovalRequestResponse createRequest(ApprovalRequestCreateDTO request, Long userId) {
        roleService.requireMember(userId);
        User requester = roleService.getUser(userId);
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(requester, society.getId());

        // Find matching workflow
        List<ApprovalWorkflow> workflows = workflowRepository
                .findBySocietyIdAndEntityTypeAndIsActiveTrue(society.getId(), request.getEntityType());

        ApprovalWorkflow matchedWorkflow = null;
        if (!workflows.isEmpty()) {
            // Find the best matching workflow based on amount range
            for (ApprovalWorkflow wf : workflows) {
                if (request.getAmount() != null) {
                    boolean minOk = wf.getMinAmount() == null || request.getAmount().compareTo(wf.getMinAmount()) >= 0;
                    boolean maxOk = wf.getMaxAmount() == null || request.getAmount().compareTo(wf.getMaxAmount()) <= 0;
                    if (minOk && maxOk) {
                        matchedWorkflow = wf;
                        break;
                    }
                } else {
                    matchedWorkflow = wf;
                    break;
                }
            }
            if (matchedWorkflow == null) {
                matchedWorkflow = workflows.get(0); // fallback to first
            }
        }

        ApprovalRequest approvalRequest = new ApprovalRequest();
        approvalRequest.setSociety(society);
        approvalRequest.setEntityType(request.getEntityType());
        approvalRequest.setEntityId(request.getEntityId());
        approvalRequest.setTitle(request.getTitle());
        approvalRequest.setDescription(request.getDescription());
        approvalRequest.setAmount(request.getAmount());
        approvalRequest.setRequestedBy(requester);
        approvalRequest.setMetadata(request.getMetadata());
        approvalRequest.setStatus("PENDING");
        approvalRequest.setCurrentStep(1);

        if (matchedWorkflow != null) {
            approvalRequest.setWorkflow(matchedWorkflow);
            approvalRequest.setTotalSteps(matchedWorkflow.getSteps().size());
        } else {
            approvalRequest.setTotalSteps(1); // default single-step approval
        }

        ApprovalRequest saved = requestRepository.save(approvalRequest);
        return mapRequestToResponse(saved);
    }

    @Override
    public ApprovalRequestResponse getRequestById(Long id) {
        ApprovalRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval request not found"));
        return mapRequestToResponse(request);
    }

    @Override
    public List<ApprovalRequestResponse> getRequestsBySociety(Long societyId) {
        return requestRepository.findBySocietyId(societyId).stream()
                .map(this::mapRequestToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ApprovalRequestResponse> getRequestsByStatus(Long societyId, String status) {
        return requestRepository.findBySocietyIdAndStatus(societyId, status).stream()
                .map(this::mapRequestToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ApprovalRequestResponse> getRequestsByEntityType(Long societyId, String entityType) {
        return requestRepository.findBySocietyIdAndEntityType(societyId, entityType).stream()
                .map(this::mapRequestToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ApprovalRequestResponse> getRequestsByUser(Long userId) {
        return requestRepository.findByRequestedById(userId).stream()
                .map(this::mapRequestToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ApprovalRequestResponse> getPendingForApprover(Long societyId, Long userId) {
        User user = roleService.getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        // Get all pending/in_review requests for this society
        List<ApprovalRequest> pending = requestRepository.findBySocietyIdAndStatus(societyId, "PENDING");
        List<ApprovalRequest> inReview = requestRepository.findBySocietyIdAndStatus(societyId, "IN_REVIEW");

        List<ApprovalRequest> all = new ArrayList<>();
        all.addAll(pending);
        all.addAll(inReview);

        // Filter: only those where the current step's approver role matches user's role
        String userRole = user.getRole().name();
        return all.stream()
                .filter(req -> {
                    if (req.getWorkflow() == null) {
                        // No workflow — any admin/committee can approve
                        return isApproverRole(user.getRole());
                    }
                    // Check if current step's approver role matches user's role
                    return req.getWorkflow().getSteps().stream()
                            .anyMatch(step -> step.getStepOrder().equals(req.getCurrentStep())
                                    && step.getApproverRole().equals(userRole));
                })
                .map(this::mapRequestToResponse)
                .collect(Collectors.toList());
    }

    // ===== ACTIONS =====

    @Override
    @Transactional
    public ApprovalRequestResponse takeAction(Long requestId, ApprovalActionRequest actionReq, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        User actor = roleService.getUser(userId);

        ApprovalRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval request not found"));
        roleService.enforceSocietyScope(actor, request.getSociety().getId());

        if ("APPROVED".equals(request.getStatus()) || "REJECTED".equals(request.getStatus())
                || "CANCELLED".equals(request.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cannot take action on a request with status: " + request.getStatus());
        }

        String action = actionReq.getAction().toUpperCase();
        if (!List.of("APPROVED", "REJECTED", "RETURNED", "ESCALATED").contains(action)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid action: " + action);
        }

        // Validate approver role against workflow step
        if (request.getWorkflow() != null) {
            String userRole = actor.getRole().name();
            boolean isValidApprover = request.getWorkflow().getSteps().stream()
                    .anyMatch(step -> step.getStepOrder().equals(request.getCurrentStep())
                            && step.getApproverRole().equals(userRole));
            if (!isValidApprover && actor.getRole() != Role.MASTER_ADMIN) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "You are not authorized to act on this step. Required role for step "
                                + request.getCurrentStep());
            }
        }

        // Record the action
        ApprovalAction approvalAction = new ApprovalAction();
        approvalAction.setApprovalRequest(request);
        approvalAction.setStepOrder(request.getCurrentStep());
        approvalAction.setAction(action);
        approvalAction.setActedBy(actor);
        approvalAction.setComments(actionReq.getComments());
        request.getActions().add(approvalAction);

        // Process the action
        switch (action) {
            case "APPROVED":
                if (request.getCurrentStep() >= request.getTotalSteps()) {
                    // Final approval
                    request.setStatus("APPROVED");
                    request.setFinalApprover(actor);
                    request.setCompletedAt(java.time.LocalDateTime.now());
                } else {
                    // Move to next step
                    request.setCurrentStep(request.getCurrentStep() + 1);
                    request.setStatus("IN_REVIEW");
                }
                break;
            case "REJECTED":
                request.setStatus("REJECTED");
                request.setRejectionReason(actionReq.getComments());
                request.setFinalApprover(actor);
                request.setCompletedAt(java.time.LocalDateTime.now());
                break;
            case "RETURNED":
                // Send back to previous step or requester
                if (request.getCurrentStep() > 1) {
                    request.setCurrentStep(request.getCurrentStep() - 1);
                }
                request.setStatus("PENDING");
                break;
            case "ESCALATED":
                // Move to next step without approval
                if (request.getCurrentStep() < request.getTotalSteps()) {
                    request.setCurrentStep(request.getCurrentStep() + 1);
                }
                request.setStatus("IN_REVIEW");
                break;
        }

        ApprovalRequest saved = requestRepository.save(request);
        return mapRequestToResponse(saved);
    }

    @Override
    @Transactional
    public ApprovalRequestResponse cancelRequest(Long requestId, Long userId) {
        User user = roleService.getUser(userId);

        ApprovalRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval request not found"));

        // Only requester or admin can cancel
        if (!request.getRequestedBy().getId().equals(userId)) {
            roleService.requireAdminOrCommittee(userId);
        }
        roleService.enforceSocietyScope(user, request.getSociety().getId());

        if ("APPROVED".equals(request.getStatus()) || "REJECTED".equals(request.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed request");
        }

        request.setStatus("CANCELLED");
        request.setCompletedAt(java.time.LocalDateTime.now());

        ApprovalRequest saved = requestRepository.save(request);
        return mapRequestToResponse(saved);
    }

    // ===== MAPPERS =====

    private boolean isApproverRole(Role role) {
        return role == Role.MASTER_ADMIN || role == Role.SOCIETY_ADMIN
                || role == Role.CHAIRMAN || role == Role.SECRETARY
                || role == Role.TREASURER || role == Role.COMMITTEE
                || role == Role.MANAGER;
    }

    private ApprovalWorkflowResponse mapWorkflowToResponse(ApprovalWorkflow workflow) {
        ApprovalWorkflowResponse resp = new ApprovalWorkflowResponse();
        resp.setId(workflow.getId());
        resp.setSocietyId(workflow.getSociety().getId());
        resp.setSocietyName(workflow.getSociety().getName());
        resp.setName(workflow.getName());
        resp.setEntityType(workflow.getEntityType());
        resp.setDescription(workflow.getDescription());
        resp.setMinAmount(workflow.getMinAmount());
        resp.setMaxAmount(workflow.getMaxAmount());
        resp.setIsActive(workflow.getIsActive());
        if (workflow.getCreatedBy() != null) {
            resp.setCreatedBy(workflow.getCreatedBy().getId());
            resp.setCreatedByName(workflow.getCreatedBy().getName());
        }
        resp.setCreatedAt(workflow.getCreatedAt());
        resp.setUpdatedAt(workflow.getUpdatedAt());

        if (workflow.getSteps() != null) {
            resp.setSteps(workflow.getSteps().stream()
                    .map(this::mapStepToResponse)
                    .collect(Collectors.toList()));
        }
        return resp;
    }

    private WorkflowStepResponse mapStepToResponse(ApprovalWorkflowStep step) {
        WorkflowStepResponse resp = new WorkflowStepResponse();
        resp.setId(step.getId());
        resp.setStepOrder(step.getStepOrder());
        resp.setApproverRole(step.getApproverRole());
        resp.setIsMandatory(step.getIsMandatory());
        resp.setAutoApproveBelow(step.getAutoApproveBelow());
        return resp;
    }

    private ApprovalRequestResponse mapRequestToResponse(ApprovalRequest request) {
        ApprovalRequestResponse resp = new ApprovalRequestResponse();
        resp.setId(request.getId());
        resp.setSocietyId(request.getSociety().getId());
        resp.setSocietyName(request.getSociety().getName());
        if (request.getWorkflow() != null) {
            resp.setWorkflowId(request.getWorkflow().getId());
            resp.setWorkflowName(request.getWorkflow().getName());
        }
        resp.setEntityType(request.getEntityType());
        resp.setEntityId(request.getEntityId());
        resp.setTitle(request.getTitle());
        resp.setDescription(request.getDescription());
        resp.setAmount(request.getAmount());
        resp.setStatus(request.getStatus());
        resp.setCurrentStep(request.getCurrentStep());
        resp.setTotalSteps(request.getTotalSteps());
        resp.setRequestedBy(request.getRequestedBy().getId());
        resp.setRequestedByName(request.getRequestedBy().getName());
        if (request.getFinalApprover() != null) {
            resp.setFinalApprover(request.getFinalApprover().getId());
            resp.setFinalApproverName(request.getFinalApprover().getName());
        }
        resp.setRejectionReason(request.getRejectionReason());
        resp.setMetadata(request.getMetadata());
        resp.setCreatedAt(request.getCreatedAt());
        resp.setUpdatedAt(request.getUpdatedAt());

        if (request.getActions() != null) {
            resp.setActions(request.getActions().stream()
                    .map(this::mapActionToResponse)
                    .collect(Collectors.toList()));
        }
        return resp;
    }

    private ApprovalActionResponse mapActionToResponse(ApprovalAction action) {
        ApprovalActionResponse resp = new ApprovalActionResponse();
        resp.setId(action.getId());
        resp.setStepOrder(action.getStepOrder());
        resp.setAction(action.getAction());
        if (action.getActedBy() != null) {
            resp.setActedBy(action.getActedBy().getId());
            resp.setActedByName(action.getActedBy().getName());
        }
        resp.setComments(action.getComments());
        resp.setCreatedAt(action.getCreatedAt());
        return resp;
    }
}
