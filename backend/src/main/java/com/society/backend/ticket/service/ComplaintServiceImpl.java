package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.ComplaintRequest;
import com.society.backend.ticket.dto.response.ComplaintResponse;
import com.society.backend.ticket.entity.Complaint;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.ticket.repository.ComplaintRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
@Service
public class ComplaintServiceImpl implements ComplaintService {
    private static final long UNDO_WINDOW_MINUTES = 5L;

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, UserRepository userRepository,
            SocietyRepository societyRepository, RoleService roleService) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    public ComplaintResponse create(Long userId, ComplaintRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setStatus("PENDING");

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
            complaint.setSociety(society);
        } else if (user.getSociety() != null) {
            complaint.setSociety(user.getSociety());
        }

        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // MASTER_ADMIN sees all complaints
        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return complaintRepository.findAll().stream()
                    .filter(this::isVisibleForListing)
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // Others see only complaints from their society
        if (user.getSociety() != null) {
            return complaintRepository.findBySocietyId(user.getSociety().getId()).stream()
                    .filter(this::isVisibleForListing)
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // No society, return empty
        return List.of();
    }

    @Override
    public List<ComplaintResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return complaintRepository.findBySocietyId(societyId).stream()
                .filter(this::isVisibleForListing)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByUser(Long userId) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() != com.society.backend.user.entity.Role.MASTER_ADMIN) {
            if (!currentUser.getId().equals(userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot access other users' complaints");
            }
        }
        return complaintRepository.findByUserId(userId).stream()
            .filter(this::isVisibleForListing)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByStatus(String status) {
        return complaintRepository.findByStatus(status).stream()
                .filter(this::isVisibleForListing)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (!isVisibleForListing(complaint)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }
        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse update(Long id, ComplaintRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot edit a deleted complaint. Undo delete first.");
        }

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());

        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public ComplaintResponse updateStatus(Long id, String status, String resolution) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot change status of a deleted complaint. Undo delete first.");
        }

        String currentStatus = complaint.getStatus() == null ? "" : complaint.getStatus().trim().toUpperCase();
        String targetStatus = status == null ? "" : status.trim().toUpperCase();

        if (targetStatus.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status is required");
        }

        if (!currentStatus.equals(targetStatus) && ("RESOLVED".equals(targetStatus) || "REJECTED".equals(targetStatus))) {
            complaint.setStatusUndoPreviousStatus(currentStatus);
            complaint.setStatusUndoPreviousResolution(complaint.getResolution());
            complaint.setStatusUndoExpiresAt(LocalDateTime.now().plusMinutes(UNDO_WINDOW_MINUTES));
        } else {
            complaint.setStatusUndoPreviousStatus(null);
            complaint.setStatusUndoPreviousResolution(null);
            complaint.setStatusUndoExpiresAt(null);
        }

        complaint.setStatus(targetStatus);
        if (resolution != null) {
            complaint.setResolution(resolution);
        }
        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public ComplaintResponse undo(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        LocalDateTime now = LocalDateTime.now();

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            if (!isUndoWindowOpen(complaint.getDeleteUndoExpiresAt(), now)) {
                throw new ApiException(HttpStatus.CONFLICT, "Delete undo window has expired");
            }

            complaint.setDeleted(false);
            complaint.setDeletedAt(null);

            if (complaint.getDeleteUndoPreviousStatus() != null && !complaint.getDeleteUndoPreviousStatus().isBlank()) {
                complaint.setStatus(complaint.getDeleteUndoPreviousStatus());
                complaint.setResolution(complaint.getDeleteUndoPreviousResolution());
            }

            complaint.setDeleteUndoPreviousStatus(null);
            complaint.setDeleteUndoPreviousResolution(null);
            complaint.setDeleteUndoExpiresAt(null);

            Complaint saved = complaintRepository.save(complaint);
            return toResponse(saved);
        }

        boolean canUndoStatus = ("RESOLVED".equalsIgnoreCase(complaint.getStatus()) || "REJECTED".equalsIgnoreCase(complaint.getStatus()))
                && isUndoWindowOpen(complaint.getStatusUndoExpiresAt(), now)
                && complaint.getStatusUndoPreviousStatus() != null
                && !complaint.getStatusUndoPreviousStatus().isBlank();

        if (canUndoStatus) {
            complaint.setStatus(complaint.getStatusUndoPreviousStatus());
            complaint.setResolution(complaint.getStatusUndoPreviousResolution());
            complaint.setStatusUndoPreviousStatus(null);
            complaint.setStatusUndoPreviousResolution(null);
            complaint.setStatusUndoExpiresAt(null);

            Complaint saved = complaintRepository.save(complaint);
            return toResponse(saved);
        }

        throw new ApiException(HttpStatus.CONFLICT, "No undo action available or undo window has expired");
    }

    @Override
    public void delete(Long id, boolean force) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        if (force) {
            complaintRepository.delete(complaint);
            return;
        }

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            return;
        }

        complaint.setDeleted(true);
        complaint.setDeletedAt(LocalDateTime.now());
        complaint.setDeleteUndoPreviousStatus(complaint.getStatus());
        complaint.setDeleteUndoPreviousResolution(complaint.getResolution());
        complaint.setDeleteUndoExpiresAt(LocalDateTime.now().plusMinutes(UNDO_WINDOW_MINUTES));

        complaintRepository.save(complaint);
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setComplaintNumber(complaint.getComplaintNumber());
        response.setUserId(complaint.getUser().getId());
        response.setRaisedByName(complaint.getUser().getName());
        if (complaint.getSociety() != null) {
            response.setSocietyId(complaint.getSociety().getId());
            response.setSocietyName(complaint.getSociety().getName());
        }
        response.setSubject(complaint.getSubject());
        response.setDescription(complaint.getDescription());
        response.setCategory(complaint.getCategory());
        response.setStatus(complaint.getStatus());
        response.setResolution(complaint.getResolution());
        response.setCreatedAt(complaint.getCreatedAt());
        response.setDeleted(Boolean.TRUE.equals(complaint.getDeleted()));
        response.setStatusUndoPreviousStatus(complaint.getStatusUndoPreviousStatus());
        response.setStatusUndoPreviousResolution(complaint.getStatusUndoPreviousResolution());
        response.setStatusUndoExpiresAt(toOffsetIsoDateTime(complaint.getStatusUndoExpiresAt()));
        response.setDeleteUndoPreviousStatus(complaint.getDeleteUndoPreviousStatus());
        response.setDeleteUndoPreviousResolution(complaint.getDeleteUndoPreviousResolution());
        response.setDeleteUndoExpiresAt(toOffsetIsoDateTime(complaint.getDeleteUndoExpiresAt()));
        return response;
    }

    private boolean isVisibleForListing(Complaint complaint) {
        if (!Boolean.TRUE.equals(complaint.getDeleted())) {
            return true;
        }
        return isUndoWindowOpen(complaint.getDeleteUndoExpiresAt(), LocalDateTime.now());
    }

    private boolean isUndoWindowOpen(LocalDateTime expiry, LocalDateTime now) {
        return expiry != null && (expiry.isAfter(now) || expiry.isEqual(now));
    }

    private String toOffsetIsoDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }
}
