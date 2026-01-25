package com.society.backend.service.impl;

import com.society.backend.dto.TicketRequest;
import com.society.backend.dto.TicketResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.Ticket;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.SocietyRepository;
import com.society.backend.repository.TicketRepository;
import com.society.backend.repository.UserRepository;
import com.society.backend.service.RoleService;
import com.society.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public TicketResponse create(TicketRequest request, Long userId) {
        roleService.requireMember(userId);

        User raisedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Ticket ticket = new Ticket();
        ticket.setRaisedBy(raisedBy);
        ticket.setSociety(society);
        ticket.setType(request.getType());
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        ticket.setStatus("OPEN");

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));
            ticket.setAssignedTo(assignedTo);
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    public TicketResponse getById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(ticket);
    }

    @Override
    public List<TicketResponse> getBySocietyId(Long societyId) {
        return ticketRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByRaisedBy(Long userId) {
        return ticketRepository.findByRaisedById(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByAssignedTo(Long userId) {
        return ticketRepository.findByAssignedToId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByStatus(String status) {
        return ticketRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getAll() {
        return ticketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse update(Long id, TicketRequest request, Long userId) {
        roleService.requireMember(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (request.getType() != null)
            ticket.setType(request.getType());
        if (request.getTitle() != null)
            ticket.setTitle(request.getTitle());
        if (request.getDescription() != null)
            ticket.setDescription(request.getDescription());
        if (request.getPriority() != null)
            ticket.setPriority(request.getPriority());

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(Long id, String status, String resolution, Long userId) {
        roleService.requireStaff(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        ticket.setStatus(status);
        if (resolution != null)
            ticket.setResolution(resolution);

        if ("RESOLVED".equalsIgnoreCase(status) || "CLOSED".equalsIgnoreCase(status)) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse assign(Long id, Long assignedToId, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));

        ticket.setAssignedTo(assignedTo);
        ticket.setStatus("IN_PROGRESS");

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        if (!ticketRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Ticket not found");
        }
        ticketRepository.deleteById(id);
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setSocietyId(ticket.getSociety().getId());
        response.setSocietyName(ticket.getSociety().getName());
        response.setRaisedById(ticket.getRaisedBy().getId());
        response.setRaisedByName(ticket.getRaisedBy().getName());

        if (ticket.getAssignedTo() != null) {
            response.setAssignedToId(ticket.getAssignedTo().getId());
            response.setAssignedToName(ticket.getAssignedTo().getName());
        }

        response.setType(ticket.getType());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setResolution(ticket.getResolution());
        response.setPendingDays(ticket.getPendingDays());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolvedAt(ticket.getResolvedAt());
        return response;
    }
}
