package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.TicketRequest;
import com.society.backend.ticket.dto.response.TicketReplyResponse;
import com.society.backend.ticket.dto.response.TicketResponse;
import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Ticket;
import com.society.backend.ticket.entity.TicketReply;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.ticket.repository.TicketReplyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final long DUPLICATE_REPLY_WINDOW_MINUTES = 5L;

    private final TicketRepository ticketRepository;
    private final TicketReplyRepository ticketReplyRepository;
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

        roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());

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
        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), ticket.getSociety().getId());
        }
        return mapToResponse(ticket);
    }

    @Override
    public List<TicketResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return ticketRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByRaisedBy(Long userId) {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findByRaisedById(userId).stream()
                .filter(t -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return t.getSociety() != null && currentUser.getSociety() != null
                            && t.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByAssignedTo(Long userId) {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findByAssignedToId(userId).stream()
                .filter(t -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return t.getSociety() != null && currentUser.getSociety() != null
                            && t.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getByStatus(String status) {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findByStatus(status).stream()
                .filter(t -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return t.getSociety() != null && currentUser.getSociety() != null
                            && t.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return ticketRepository.findAll().stream()
                .filter(t -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return t.getSociety() != null && currentUser.getSociety() != null
                            && t.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse update(Long id, TicketRequest request, Long userId) {
        roleService.requireMember(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

        if (request.getType() != null)
            ticket.setType(request.getType());
        if (request.getTitle() != null)
            ticket.setTitle(request.getTitle());
        if (request.getDescription() != null)
            ticket.setDescription(request.getDescription());
        if (request.getPriority() != null)
            ticket.setPriority(request.getPriority());
        if (request.getProgressPercent() != null)
            ticket.setProgressPercent(request.getProgressPercent());

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(Long id, String status, String resolution, Long userId) {
        roleService.requireStaff(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

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
    public TicketResponse addReply(Long id, String message, Long userId) {
        roleService.requireStaff(userId);

        if (message == null || message.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reply message is required");
        }

        String normalizedMessage = message.trim();

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        User actor = roleService.getUser(userId);
        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(actor, ticket.getSociety().getId());
        }

            LocalDateTime duplicateWindowStart = LocalDateTime.now().minusMinutes(DUPLICATE_REPLY_WINDOW_MINUTES);
            boolean hasRecentDuplicate = ticketReplyRepository
                .findByTicketIdAndRepliedByIdAndCreatedAtAfterOrderByCreatedAtDesc(
                    ticket.getId(),
                    actor.getId(),
                    duplicateWindowStart
                )
                .stream()
                .anyMatch(existing -> normalizeReplyText(existing.getMessage()).equals(normalizeReplyText(normalizedMessage)));

            if (hasRecentDuplicate) {
                throw new ApiException(HttpStatus.CONFLICT, "You already sent this reply recently.");
            }

            ticket.setResolution(normalizedMessage);
        ticket.setLastReplyBy(actor.getName());
        ticket.setLastReplyAt(LocalDateTime.now());

        TicketReply reply = new TicketReply();
        reply.setTicket(ticket);
        reply.setRepliedBy(actor);
            reply.setMessage(normalizedMessage);
        ticketReplyRepository.save(reply);

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    public List<TicketReplyResponse> getReplies(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), ticket.getSociety().getId());
        }

        return ticketReplyRepository.findByTicketIdOrderByCreatedAtAsc(id).stream()
                .map(this::mapReplyToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse assign(Long id, Long assignedToId, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));

        ticket.setAssignedTo(assignedTo);
        ticket.setStatus("IN_PROGRESS");

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateProgress(Long id, Integer progress, Long userId) {
        roleService.requireStaff(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

        // Validate progress is between 0 and 100
        if (progress < 0)
            progress = 0;
        if (progress > 100)
            progress = 100;

        ticket.setProgressPercent(progress);

        // Auto-update status based on progress
        if (progress == 100 && !"RESOLVED".equals(ticket.getStatus()) && !"CLOSED".equals(ticket.getStatus())) {
            ticket.setStatus("RESOLVED");
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (progress > 0 && "OPEN".equals(ticket.getStatus())) {
            ticket.setStatus("IN_PROGRESS");
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }
        ticketRepository.deleteById(id);
    }

    @Override
    public List<TicketResponse> getOverdue() {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findAll().stream()
                .filter(ticket -> {
                    if (currentUser.getRole() != com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        if (ticket.getSociety() == null || currentUser.getSociety() == null
                                || !ticket.getSociety().getId().equals(currentUser.getSociety().getId())) {
                            return false;
                        }
                    }
                    ticket.updateOverdueStatus();
                    return ticket.getIsOverdue();
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getOverdueBySociety(Long societyId) {
        return ticketRepository.findBySocietyId(societyId).stream()
                .filter(ticket -> {
                    ticket.updateOverdueStatus();
                    return ticket.getIsOverdue();
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Long getOverdueCount() {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findAll().stream()
                .filter(ticket -> {
                    if (currentUser.getRole() != com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        if (ticket.getSociety() == null || currentUser.getSociety() == null
                                || !ticket.getSociety().getId().equals(currentUser.getSociety().getId())) {
                            return false;
                        }
                    }
                    ticket.updateOverdueStatus();
                    return ticket.getIsOverdue();
                })
                .count();
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTicketNumber(ticket.getTicketNumber());
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
        response.setLastReplyBy(ticket.getLastReplyBy());
        response.setLastReplyAt(ticket.getLastReplyAt());
        response.setProgressPercent(ticket.getProgressPercent() != null ? ticket.getProgressPercent() : 0);
        response.setPendingDays(ticket.getPendingDays());
        
        // Update and set overdue information
        ticket.updateOverdueStatus();
        response.setIsOverdue(ticket.getIsOverdue());
        response.setOverdueDays(ticket.getOverdueDays());
        response.setEscalationLevel(ticket.getEscalationLevel());
        
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolvedAt(ticket.getResolvedAt());
        return response;
    }

    private TicketReplyResponse mapReplyToResponse(TicketReply reply) {
        TicketReplyResponse response = new TicketReplyResponse();
        response.setId(reply.getId());
        response.setTicketId(reply.getTicket().getId());
        response.setRepliedById(reply.getRepliedBy().getId());
        response.setRepliedByName(reply.getRepliedBy().getName());
        response.setMessage(reply.getMessage());
        response.setCreatedAt(reply.getCreatedAt());
        return response;
    }

    private String normalizeReplyText(String message) {
        return message == null ? "" : message.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
