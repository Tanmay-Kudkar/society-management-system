package com.society.backend.service.ticket;

import com.society.backend.dto.ticket.TicketRequest;
import com.society.backend.dto.ticket.TicketResponse;

import java.util.List;

public interface TicketService {
    TicketResponse create(TicketRequest request, Long userId);

    TicketResponse getById(Long id);

    List<TicketResponse> getBySocietyId(Long societyId);

    List<TicketResponse> getByRaisedBy(Long userId);

    List<TicketResponse> getByAssignedTo(Long userId);

    List<TicketResponse> getByStatus(String status);

    List<TicketResponse> getAll();

    TicketResponse update(Long id, TicketRequest request, Long userId);

    TicketResponse updateStatus(Long id, String status, String resolution, Long userId);

    TicketResponse assign(Long id, Long assignedToId, Long userId);

    TicketResponse updateProgress(Long id, Integer progress, Long userId);

    void delete(Long id, Long userId);

    // Overdue tracking methods
    List<TicketResponse> getOverdue();

    List<TicketResponse> getOverdueBySociety(Long societyId);

    Long getOverdueCount();
}
