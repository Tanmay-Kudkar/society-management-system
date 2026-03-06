package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.WorkOrderRequest;
import com.society.backend.ticket.dto.WorkOrderResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface WorkOrderService {
    WorkOrderResponse create(Long userId, WorkOrderRequest request);
    WorkOrderResponse getById(Long id);
    List<WorkOrderResponse> getBySociety(Long societyId);
    List<WorkOrderResponse> getByStatus(Long societyId, String status);
    List<WorkOrderResponse> getByCategory(Long societyId, String category);
    List<WorkOrderResponse> getByPriority(Long societyId, String priority);
    List<WorkOrderResponse> getByAssignee(Long assignedToId);
    List<WorkOrderResponse> getByRequester(Long requestedById);
    WorkOrderResponse assign(Long id, Long assignedToId);
    WorkOrderResponse startWork(Long id);
    WorkOrderResponse putOnHold(Long id, String notes);
    WorkOrderResponse complete(Long id, String resolutionNotes, BigDecimal actualCost);
    WorkOrderResponse cancel(Long id, String reason);
    Map<String, Long> getCounts(Long societyId);
    void delete(Long id, Long userId);
}
