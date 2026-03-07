package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.WorkOrderRequest;
import com.society.backend.ticket.dto.response.WorkOrderResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.ticket.entity.WorkOrder;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.ticket.repository.WorkOrderRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WorkOrderServiceImpl implements WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    public WorkOrderServiceImpl(WorkOrderRepository workOrderRepository, UserRepository userRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository, RoleService roleService) {
        this.workOrderRepository = workOrderRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.roleService = roleService;
    }

    @Override
    public WorkOrderResponse create(Long userId, WorkOrderRequest request) {
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(requester, society.getId());

        WorkOrder wo = new WorkOrder();
        wo.setSociety(society);
        wo.setTitle(request.getTitle());
        wo.setDescription(request.getDescription());
        wo.setCategory(request.getCategory());
        wo.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        wo.setRequestedBy(requester);
        wo.setLocation(request.getLocation());
        wo.setEstimatedCost(request.getEstimatedCost());
        wo.setScheduledDate(request.getScheduledDate());
        wo.setNotes(request.getNotes());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            wo.setFlat(flat);
        }

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));
            wo.setAssignedTo(assignee);
            wo.setStatus("ASSIGNED");
        }

        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public WorkOrderResponse getById(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());
        return toResponse(wo);
    }

    @Override
    public List<WorkOrderResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return workOrderRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderResponse> getByStatus(Long societyId, String status) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return workOrderRepository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderResponse> getByCategory(Long societyId, String category) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return workOrderRepository.findBySocietyIdAndCategoryOrderByCreatedAtDesc(societyId, category).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderResponse> getByPriority(Long societyId, String priority) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return workOrderRepository.findBySocietyIdAndPriorityOrderByCreatedAtDesc(societyId, priority).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderResponse> getByAssignee(Long assignedToId) {
        return workOrderRepository.findByAssignedToIdOrderByCreatedAtDesc(assignedToId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderResponse> getByRequester(Long requestedById) {
        return workOrderRepository.findByRequestedByIdOrderByCreatedAtDesc(requestedById).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public WorkOrderResponse assign(Long id, Long assignedToId) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());

        if ("COMPLETED".equals(wo.getStatus()) || "CANCELLED".equals(wo.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot assign a " + wo.getStatus() + " work order.");
        }

        User assignee = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));
        wo.setAssignedTo(assignee);
        if ("OPEN".equals(wo.getStatus())) {
            wo.setStatus("ASSIGNED");
        }
        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public WorkOrderResponse startWork(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());

        if (!"ASSIGNED".equals(wo.getStatus()) && !"ON_HOLD".equals(wo.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Can only start ASSIGNED or ON_HOLD work orders.");
        }

        wo.setStatus("IN_PROGRESS");
        wo.setStartedAt(LocalDateTime.now());
        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public WorkOrderResponse putOnHold(Long id, String notes) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());

        if ("COMPLETED".equals(wo.getStatus()) || "CANCELLED".equals(wo.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot hold a " + wo.getStatus() + " work order.");
        }

        wo.setStatus("ON_HOLD");
        if (notes != null) {
            wo.setNotes((wo.getNotes() != null ? wo.getNotes() + "\n" : "") + "[HOLD] " + notes);
        }
        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public WorkOrderResponse complete(Long id, String resolutionNotes, BigDecimal actualCost) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());

        if ("COMPLETED".equals(wo.getStatus()) || "CANCELLED".equals(wo.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Work order is already " + wo.getStatus());
        }

        wo.setStatus("COMPLETED");
        wo.setCompletedAt(LocalDateTime.now());
        wo.setResolutionNotes(resolutionNotes);
        if (actualCost != null) {
            wo.setActualCost(actualCost);
        }
        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public WorkOrderResponse cancel(Long id, String reason) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());

        if ("COMPLETED".equals(wo.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed work order.");
        }

        wo.setStatus("CANCELLED");
        wo.setResolutionNotes(reason);
        return toResponse(workOrderRepository.save(wo));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        Map<String, Long> counts = new HashMap<>();
        counts.put("open", workOrderRepository.countBySocietyIdAndStatus(societyId, "OPEN"));
        counts.put("assigned", workOrderRepository.countBySocietyIdAndStatus(societyId, "ASSIGNED"));
        counts.put("inProgress", workOrderRepository.countBySocietyIdAndStatus(societyId, "IN_PROGRESS"));
        counts.put("onHold", workOrderRepository.countBySocietyIdAndStatus(societyId, "ON_HOLD"));
        counts.put("completed", workOrderRepository.countBySocietyIdAndStatus(societyId, "COMPLETED"));
        counts.put("cancelled", workOrderRepository.countBySocietyIdAndStatus(societyId, "CANCELLED"));
        return counts;
    }

    @Override
    public void delete(Long id, Long userId) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work order not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), wo.getSociety().getId());
        workOrderRepository.deleteById(id);
    }

    private WorkOrderResponse toResponse(WorkOrder wo) {
        WorkOrderResponse r = new WorkOrderResponse();
        r.setId(wo.getId());
        r.setSocietyId(wo.getSociety().getId());
        r.setSocietyName(wo.getSociety().getName());
        r.setTitle(wo.getTitle());
        r.setDescription(wo.getDescription());
        r.setCategory(wo.getCategory());
        r.setPriority(wo.getPriority());
        r.setStatus(wo.getStatus());
        r.setRequestedById(wo.getRequestedBy().getId());
        r.setRequestedByName(wo.getRequestedBy().getName());
        if (wo.getAssignedTo() != null) {
            r.setAssignedToId(wo.getAssignedTo().getId());
            r.setAssignedToName(wo.getAssignedTo().getName());
        }
        if (wo.getFlat() != null) {
            r.setFlatId(wo.getFlat().getId());
            r.setFlatNumber(wo.getFlat().getFlatNumber());
        }
        r.setLocation(wo.getLocation());
        r.setEstimatedCost(wo.getEstimatedCost());
        r.setActualCost(wo.getActualCost());
        r.setScheduledDate(wo.getScheduledDate());
        r.setStartedAt(wo.getStartedAt());
        r.setCompletedAt(wo.getCompletedAt());
        r.setNotes(wo.getNotes());
        r.setResolutionNotes(wo.getResolutionNotes());
        r.setCreatedAt(wo.getCreatedAt());
        r.setUpdatedAt(wo.getUpdatedAt());
        return r;
    }
}
