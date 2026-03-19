package com.society.backend.ticket.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.exception.LinkedRecordsConflictException;
import com.society.backend.common.service.RoleService;
import com.society.backend.society.entity.Society;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.ticket.dto.request.TicketRequest;
import com.society.backend.ticket.dto.response.TicketReplyResponse;
import com.society.backend.ticket.dto.response.TicketResponse;
import com.society.backend.ticket.entity.ApprovalRequest;
import com.society.backend.ticket.entity.Ticket;
import com.society.backend.ticket.entity.TicketReply;
import com.society.backend.ticket.repository.ApprovalRequestRepository;
import com.society.backend.ticket.repository.TicketReplyRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final long DUPLICATE_REPLY_WINDOW_MINUTES = 5L;
    private static final long CLOSE_UNDO_WINDOW_MINUTES = 5L;
    private static final String TICKET_CREATE_APPROVAL_ENTITY_TYPE = "TICKET_CREATE";
    private static final String TICKET_CLOSE_APPROVAL_ENTITY_TYPE = "TICKET_CLOSE";

    private final TicketRepository ticketRepository;
    private final TicketReplyRepository ticketReplyRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
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

        if (raisedBy.getRole() == Role.COMMITTEE) {
            if (raisedBy.getFlat() == null) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Committee members can raise tickets only for their assigned flat.");
            }

            String type = request.getType() == null ? "" : request.getType().toUpperCase();
            if (!"REQUEST".equals(type) && !"ISSUE".equals(type)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Committee members can raise only REQUEST or ISSUE tickets.");
            }

            if (request.getAssignedToId() != null) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Committee members cannot assign tickets while creating them.");
            }
        }

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

        if (isAdminRole(raisedBy.getRole())) {
            ticket.setStatus("IN_REVIEW");
        }

        Ticket saved = ticketRepository.save(ticket);

        if (isAdminRole(raisedBy.getRole())) {
            ApprovalRequest approvalRequest = new ApprovalRequest();
            approvalRequest.setSociety(saved.getSociety());
            approvalRequest.setEntityType(TICKET_CREATE_APPROVAL_ENTITY_TYPE);
            approvalRequest.setEntityId(saved.getId());
            approvalRequest.setTitle("Ticket creation approval - "
                    + (saved.getTicketNumber() != null ? saved.getTicketNumber() : ("#" + saved.getId())));
            approvalRequest.setDescription("Ticket created by Admin requires C/S/T/CM approval: " + saved.getTitle());
            approvalRequest.setRequestedBy(raisedBy);
            approvalRequest.setStatus("PENDING");
            approvalRequest.setCurrentStep(1);
            approvalRequest.setTotalSteps(1);
            approvalRequestRepository.save(approvalRequest);
        }

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
                    if (currentUser.getRole() == Role.MASTER_ADMIN) return true;
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
                    if (currentUser.getRole() == Role.MASTER_ADMIN) return true;
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
                    if (currentUser.getRole() == Role.MASTER_ADMIN) return true;
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
                    if (currentUser.getRole() == Role.MASTER_ADMIN) {
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

        if (request.getType() != null) ticket.setType(request.getType());
        if (request.getTitle() != null) ticket.setTitle(request.getTitle());
        if (request.getDescription() != null) ticket.setDescription(request.getDescription());
        if (request.getPriority() != null) ticket.setPriority(request.getPriority());
        if (request.getProgressPercent() != null) ticket.setProgressPercent(request.getProgressPercent());

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(Long id, String status, String resolution, Long userId) {
        roleService.requireTicketManager(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        User actor = roleService.getUser(userId);
        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(actor, ticket.getSociety().getId());
        }

        String targetStatus = status != null ? status.toUpperCase() : "";
        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "";

        if ((actor.getRole() == Role.SOCIETY_ADMIN || actor.getRole() == Role.MASTER_ADMIN)
            && isTicketRaisedByCstcm(ticket)
                && ("RESOLVED".equals(targetStatus) || "CLOSED".equals(targetStatus))) {
            List<ApprovalRequest> closeApprovals = approvalRequestRepository
                    .findByEntityTypeAndEntityId(TICKET_CLOSE_APPROVAL_ENTITY_TYPE, ticket.getId());

            boolean hasApproved = closeApprovals.stream()
                    .anyMatch(req -> "APPROVED".equalsIgnoreCase(req.getStatus()));

            if (!hasApproved) {
                boolean hasPending = closeApprovals.stream()
                        .anyMatch(req -> "PENDING".equalsIgnoreCase(req.getStatus())
                                || "IN_REVIEW".equalsIgnoreCase(req.getStatus()));

                if (hasPending) {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Ticket closure approval is already pending with C/S/T/CM.");
                }

                ApprovalRequest approvalRequest = new ApprovalRequest();
                approvalRequest.setSociety(ticket.getSociety());
                approvalRequest.setEntityType(TICKET_CLOSE_APPROVAL_ENTITY_TYPE);
                approvalRequest.setEntityId(ticket.getId());
                approvalRequest.setTitle("Ticket closure approval - "
                        + (ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ("#" + ticket.getId())));
                approvalRequest.setDescription("Closure requested by Society Admin for ticket: " + ticket.getTitle());
                approvalRequest.setRequestedBy(actor);
                approvalRequest.setStatus("PENDING");
                approvalRequest.setCurrentStep(1);
                approvalRequest.setTotalSteps(1);
                approvalRequest.setMetadata("desiredStatus=" + targetStatus + ";requiredApproverUserId=" + ticket.getRaisedBy().getId());
                approvalRequestRepository.save(approvalRequest);

                ticket.setStatus("IN_REVIEW");
                if (resolution != null) {
                    ticket.setResolution(resolution);
                }
                Ticket staged = ticketRepository.save(ticket);
                return mapToResponse(staged);
            }
        }

        ticket.setStatus(targetStatus);
        if (resolution != null) {
            ticket.setResolution(resolution);
        }

        if (!"CLOSED".equalsIgnoreCase(targetStatus)) {
            ticket.setCloseUndoPreviousStatus(null);
            ticket.setCloseUndoExpiresAt(null);
        }

        if ("OPEN".equalsIgnoreCase(targetStatus)) {
            ticket.setProgressPercent(0);
            ticket.setResolvedAt(null);
        } else if ("IN_PROGRESS".equalsIgnoreCase(targetStatus)) {
            Integer currentProgress = ticket.getProgressPercent() != null ? ticket.getProgressPercent() : 0;
            if (currentProgress <= 0) {
                ticket.setProgressPercent(10);
            }
            ticket.setResolvedAt(null);
        }

        if ("RESOLVED".equalsIgnoreCase(targetStatus) || "CLOSED".equalsIgnoreCase(targetStatus)) {
            ticket.setProgressPercent(100);
            ticket.setResolvedAt(LocalDateTime.now());

            if ("CLOSED".equalsIgnoreCase(targetStatus) && !"CLOSED".equalsIgnoreCase(currentStatus)) {
                String fallbackStatus = "IN_PROGRESS";
                String previousStatus = currentStatus.isBlank() ? fallbackStatus : currentStatus;
                ticket.setCloseUndoPreviousStatus(previousStatus);
                ticket.setCloseUndoExpiresAt(LocalDateTime.now().plusMinutes(CLOSE_UNDO_WINDOW_MINUTES));
            }
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse addReply(Long id, String message, Long userId) {
        roleService.requireTicketManager(userId);

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
                        duplicateWindowStart)
                .stream()
                .anyMatch(existing -> normalizeReplyText(existing.getMessage())
                        .equals(normalizeReplyText(normalizedMessage)));

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
        roleService.requireTicketAssigner(userId);

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
        roleService.requireTicketManager(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

        if ("IN_REVIEW".equalsIgnoreCase(ticket.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Progress cannot be edited while ticket is in review.");
        }

        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;

        ticket.setProgressPercent(progress);

        if (progress == 100 && !"RESOLVED".equals(ticket.getStatus()) && !"CLOSED".equals(ticket.getStatus())) {
            ticket.setStatus("RESOLVED");
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (progress == 0) {
            ticket.setStatus("OPEN");
            ticket.setResolvedAt(null);
        } else if (progress > 0 && progress < 100) {
            ticket.setStatus("IN_PROGRESS");
            ticket.setResolvedAt(null);
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId, boolean force) {
        roleService.requireAdminOrCommittee(userId);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (ticket.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), ticket.getSociety().getId());
        }

        long replyCount = ticketReplyRepository.countByTicketId(id);
        long createApprovalCount = approvalRequestRepository.countByEntityTypeAndEntityId(TICKET_CREATE_APPROVAL_ENTITY_TYPE, id);
        long closeApprovalCount = approvalRequestRepository.countByEntityTypeAndEntityId(TICKET_CLOSE_APPROVAL_ENTITY_TYPE, id);
        long approvalCount = createApprovalCount + closeApprovalCount;

        if (!force && (replyCount > 0 || approvalCount > 0)) {
            List<LinkedRecordsConflictException.Impact> impacts = new ArrayList<>();
            if (replyCount > 0) {
                impacts.add(new LinkedRecordsConflictException.Impact("Ticket Replies", replyCount));
            }
            if (approvalCount > 0) {
                impacts.add(new LinkedRecordsConflictException.Impact("Approval Requests", approvalCount));
            }

            throw new LinkedRecordsConflictException(
                    String.format(
                            "Cannot delete ticket '%s'. Linked records: %d replies, %d approval requests. Use force delete to auto-clean linked records.",
                            ticket.getTitle(),
                            replyCount,
                            approvalCount),
                    impacts);
        }

        if (force) {
            if (replyCount > 0) {
                ticketReplyRepository.deleteByTicketId(id);
            }
            if (createApprovalCount > 0) {
                approvalRequestRepository.deleteByEntityTypeAndEntityId(TICKET_CREATE_APPROVAL_ENTITY_TYPE, id);
            }
            if (closeApprovalCount > 0) {
                approvalRequestRepository.deleteByEntityTypeAndEntityId(TICKET_CLOSE_APPROVAL_ENTITY_TYPE, id);
            }
        }

        ticketRepository.deleteById(id);
    }

    @Override
    public List<TicketResponse> getOverdue() {
        var currentUser = roleService.getCurrentUser();
        return ticketRepository.findAll().stream()
                .filter(ticket -> {
                    if (currentUser.getRole() != Role.MASTER_ADMIN) {
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
                    if (currentUser.getRole() != Role.MASTER_ADMIN) {
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
        response.setLastReplyAt(toOffsetIsoDateTime(ticket.getLastReplyAt()));
        response.setProgressPercent(ticket.getProgressPercent() != null ? ticket.getProgressPercent() : 0);
        response.setPendingDays(ticket.getPendingDays());

        ticket.updateOverdueStatus();
        response.setIsOverdue(ticket.getIsOverdue());
        response.setOverdueDays(ticket.getOverdueDays());
        response.setEscalationLevel(ticket.getEscalationLevel());

        response.setCreatedAt(toOffsetIsoDateTime(ticket.getCreatedAt()));
        response.setUpdatedAt(toOffsetIsoDateTime(ticket.getUpdatedAt()));
        response.setResolvedAt(toOffsetIsoDateTime(ticket.getResolvedAt()));
        response.setCloseUndoPreviousStatus(ticket.getCloseUndoPreviousStatus());
        response.setCloseUndoExpiresAt(toOffsetIsoDateTime(ticket.getCloseUndoExpiresAt()));
        return response;
    }

    private TicketReplyResponse mapReplyToResponse(TicketReply reply) {
        TicketReplyResponse response = new TicketReplyResponse();
        response.setId(reply.getId());
        response.setTicketId(reply.getTicket().getId());
        response.setRepliedById(reply.getRepliedBy().getId());
        response.setRepliedByName(reply.getRepliedBy().getName());
        response.setMessage(reply.getMessage());
        response.setCreatedAt(toOffsetIsoDateTime(reply.getCreatedAt()));
        return response;
    }

    private String normalizeReplyText(String message) {
        return message == null ? "" : message.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String toOffsetIsoDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }

    private boolean isAdminRole(Role role) {
        return role == Role.SOCIETY_ADMIN || role == Role.MASTER_ADMIN;
    }

    private boolean isTicketRaisedByCstcm(Ticket ticket) {
        if (ticket == null || ticket.getRaisedBy() == null || ticket.getRaisedBy().getRole() == null) {
            return false;
        }
        Role raisedByRole = ticket.getRaisedBy().getRole();
        return raisedByRole == Role.CHAIRMAN
                || raisedByRole == Role.SECRETARY
                || raisedByRole == Role.TREASURER
                || raisedByRole == Role.COMMITTEE;
    }
}
