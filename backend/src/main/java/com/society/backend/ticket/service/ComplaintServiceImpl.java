package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.ComplaintRequest;
import com.society.backend.ticket.dto.response.ComplaintAttachmentUploadResponse;
import com.society.backend.ticket.dto.response.ComplaintCommentResponse;
import com.society.backend.ticket.dto.response.ComplaintHistoryResponse;
import com.society.backend.ticket.dto.response.ComplaintResponse;
import com.society.backend.ticket.dto.response.ComplaintSlaSummaryResponse;
import com.society.backend.ticket.entity.ComplaintComment;
import com.society.backend.ticket.entity.ComplaintHistory;
import com.society.backend.ticket.entity.ComplaintUpload;
import com.society.backend.ticket.entity.Complaint;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.ticket.repository.ComplaintCommentRepository;
import com.society.backend.ticket.repository.ComplaintHistoryRepository;
import com.society.backend.ticket.repository.ComplaintRepository;
import com.society.backend.ticket.repository.ComplaintUploadRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {
    private static final long UNDO_WINDOW_MINUTES = 5L;
    private static final long DUE_SOON_THRESHOLD_MINUTES = 120L;
    private static final long MAX_ATTACHMENT_SIZE_BYTES = 25L * 1024L * 1024L;
    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED");
    private static final Set<String> ALLOWED_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "URGENT");
    private static final Set<String> ALLOWED_CATEGORIES = Set.of("NOISE", "PARKING", "MAINTENANCE", "SECURITY", "CLEANLINESS", "NEIGHBOR_ISSUE", "OTHER");
    private static final Set<Role> MEMBER_DIRECT_COMMUNICATION_ROLES = Set.of(Role.MEMBER);
    private static final Map<String, Long> SLA_MINUTES_BY_PRIORITY = Map.of(
            "LOW", 72L * 60L,
            "MEDIUM", 48L * 60L,
            "HIGH", 24L * 60L,
            "URGENT", 8L * 60L
    );

    @Value("${member.office-hours.start:09:30}")
    private String memberOfficeHoursStart;

    @Value("${member.office-hours.end:18:30}")
    private String memberOfficeHoursEnd;

    @Value("${member.office-hours.zone:Asia/Kolkata}")
    private String memberOfficeHoursZone;

    @Value("${member.office-hours.days:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY}")
    private String memberOfficeHoursDays;

    @Value("${member.direct-communication.complaint-categories:NOISE,PARKING,MAINTENANCE,CLEANLINESS,NEIGHBOR_ISSUE,OTHER}")
    private String memberDirectComplaintCategories;

    @PersistenceContext
    private EntityManager entityManager;

    private final ComplaintRepository complaintRepository;
    private final ComplaintCommentRepository complaintCommentRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final ComplaintUploadRepository complaintUploadRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository,
            ComplaintCommentRepository complaintCommentRepository,
            ComplaintHistoryRepository complaintHistoryRepository,
            ComplaintUploadRepository complaintUploadRepository,
            UserRepository userRepository,
            SocietyRepository societyRepository,
            RoleService roleService) {
        this.complaintRepository = complaintRepository;
        this.complaintCommentRepository = complaintCommentRepository;
        this.complaintHistoryRepository = complaintHistoryRepository;
        this.complaintUploadRepository = complaintUploadRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    public ComplaintResponse create(Long userId, ComplaintRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        boolean canManageAdvancedFields = canManageAdvancedComplaintFields(user);
        String normalizedCategory = normalizeCategory(request.getCategory());

        if (isRestrictedMemberDirectCommunication(user, normalizedCategory)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                "Direct communication is allowed only during office timings. Outside office timings, please raise a ticket for your request or issue.");
        }

        if (!canManageAdvancedFields && hasAdvancedComplaintFieldValues(request)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Only Master Admin or Society Admin can set assignment and admin complaint fields.");
        }

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(normalizedCategory);
        complaint.setPriority(normalizePriority(request.getPriority()));
        complaint.setWing(cleanString(request.getWing()));
        complaint.setFloor(request.getFloor());
        complaint.setFlatNumber(cleanString(request.getFlatNumber()));
        complaint.setLocationDetails(cleanString(request.getLocationDetails()));
        complaint.setAdminRemarks(canManageAdvancedFields ? cleanString(request.getAdminRemarks()) : null);
        complaint.setAttachmentUrls(normalizeAttachmentUrls(request.getAttachmentUrls()));
        complaint.setStatus("PENDING");
        User resolvedAssignedUser = null;
        User resolvedRaisedForUser = null;

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
            complaint.setSociety(society);
        } else if (user.getSociety() != null) {
            complaint.setSociety(user.getSociety());
        }

        if (canManageAdvancedFields && request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));
            if (complaint.getSociety() != null && assignedUser.getSociety() != null
                    && !complaint.getSociety().getId().equals(assignedUser.getSociety().getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user must belong to the same society");
            }
            complaint.setAssignedToUser(assignedUser);
            resolvedAssignedUser = assignedUser;
        }

        if (canManageAdvancedFields && request.getRaisedForUserId() != null) {
            User raisedForUser = userRepository.findById(request.getRaisedForUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Raised-for user not found"));
            if (complaint.getSociety() != null && raisedForUser.getSociety() != null
                    && !complaint.getSociety().getId().equals(raisedForUser.getSociety().getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Raised-for user must belong to the same society");
            }
            complaint.setRaisedForUser(raisedForUser);
            resolvedRaisedForUser = raisedForUser;
        }

        complaint.setRaisedForReason(canManageAdvancedFields ? cleanString(request.getRaisedForReason()) : null);
        populateUnitDetailsFromUser(complaint, resolvedRaisedForUser != null ? resolvedRaisedForUser : (resolvedAssignedUser != null ? resolvedAssignedUser : user));

        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, user, "CREATED", null, saved.getStatus(), "Complaint created");
        return toResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // MASTER_ADMIN sees all complaints
        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return sortComplaintsByLatest(complaintRepository.findAll()).stream()
                    .filter(this::isVisibleForListing)
                    .filter(complaint -> canViewComplaint(user, complaint))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // Others see only complaints from their society
        if (user.getSociety() != null) {
            return sortComplaintsByLatest(complaintRepository.findBySocietyId(user.getSociety().getId())).stream()
                    .filter(this::isVisibleForListing)
                    .filter(complaint -> canViewComplaint(user, complaint))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // No society, return empty
        return List.of();
    }

    @Override
    public List<ComplaintResponse> getBySociety(Long societyId) {
        User currentUser = roleService.getCurrentUser();
        roleService.enforceSocietyScope(currentUser, societyId);
        return sortComplaintsByLatest(complaintRepository.findBySocietyId(societyId)).stream()
                .filter(this::isVisibleForListing)
            .filter(complaint -> canViewComplaint(currentUser, complaint))
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
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(this::isVisibleForListing)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByStatus(String status) {
        User currentUser = roleService.getCurrentUser();
        return sortComplaintsByLatest(complaintRepository.findByStatus(status)).stream()
                .filter(this::isVisibleForListing)
            .filter(complaint -> canViewComplaint(currentUser, complaint))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getById(Long id) {
        User currentUser = roleService.getCurrentUser();
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (!isVisibleForListing(complaint)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }

        if (!canViewComplaint(currentUser, complaint)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }
        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse update(Long id, ComplaintRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();
        boolean canManageAdvancedFields = canManageAdvancedComplaintFields(actor);

        if (!canManageAdvancedFields && hasAdvancedComplaintFieldValues(request)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                "Only Master Admin or Society Admin can update assignment and admin complaint fields.");
        }

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot edit a deleted complaint. Undo delete first.");
        }

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(normalizeCategory(request.getCategory()));
        complaint.setPriority(normalizePriority(request.getPriority()));
        complaint.setWing(cleanString(request.getWing()));
        complaint.setFloor(request.getFloor());
        complaint.setFlatNumber(cleanString(request.getFlatNumber()));
        complaint.setLocationDetails(cleanString(request.getLocationDetails()));
        if (canManageAdvancedFields) {
            complaint.setAdminRemarks(cleanString(request.getAdminRemarks()));
        }
        complaint.setAttachmentUrls(normalizeAttachmentUrls(request.getAttachmentUrls()));
        User resolvedAssignedUser = complaint.getAssignedToUser();
        User resolvedRaisedForUser = complaint.getRaisedForUser();

        if (canManageAdvancedFields && request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));
            if (complaint.getSociety() != null && assignedUser.getSociety() != null
                    && !complaint.getSociety().getId().equals(assignedUser.getSociety().getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user must belong to the same society");
            }
            complaint.setAssignedToUser(assignedUser);
            resolvedAssignedUser = assignedUser;
        }

        if (canManageAdvancedFields && request.getRaisedForUserId() != null) {
            User raisedForUser = userRepository.findById(request.getRaisedForUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Raised-for user not found"));
            if (complaint.getSociety() != null && raisedForUser.getSociety() != null
                    && !complaint.getSociety().getId().equals(raisedForUser.getSociety().getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Raised-for user must belong to the same society");
            }
            complaint.setRaisedForUser(raisedForUser);
            resolvedRaisedForUser = raisedForUser;
        }

        if (canManageAdvancedFields) {
            complaint.setRaisedForReason(cleanString(request.getRaisedForReason()));
        }
        populateUnitDetailsFromUser(complaint, resolvedRaisedForUser != null ? resolvedRaisedForUser : resolvedAssignedUser);

        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, actor, "UPDATED", null, saved.getStatus(), "Complaint details updated");
        return toResponse(saved);
    }

    @Override
    public ComplaintResponse updateStatus(Long id, String status, String resolution) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        if (Boolean.TRUE.equals(complaint.getDeleted())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot change status of a deleted complaint. Undo delete first.");
        }

        String beforeStatus = complaint.getStatus();
        String currentStatus = complaint.getStatus() == null ? "" : complaint.getStatus().trim().toUpperCase();
        String targetStatus = normalizeStatus(status);

        if (("RESOLVED".equalsIgnoreCase(targetStatus) || "REJECTED".equalsIgnoreCase(targetStatus))
            && (actor.getRole() == Role.SOCIETY_ADMIN || actor.getRole() == Role.MANAGER)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                "Closure approval required from Chairman/Secretary/Treasurer.");
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
        if ("RESOLVED".equals(targetStatus)) {
            complaint.setResolvedAt(LocalDateTime.now());
        } else if (!"RESOLVED".equals(targetStatus)) {
            complaint.setResolvedAt(null);
        }
        if (resolution != null) {
            complaint.setResolution(resolution);
        }
        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, actor, "STATUS_CHANGED", beforeStatus, saved.getStatus(), "Status updated");
        return toResponse(saved);
    }

    @Override
    public ComplaintResponse assign(Long id, Long assignedToUserId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        User assignedUser = userRepository.findById(assignedToUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));

        if (complaint.getSociety() != null && assignedUser.getSociety() != null
                && !complaint.getSociety().getId().equals(assignedUser.getSociety().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user must belong to the same society");
        }

        complaint.setAssignedToUser(assignedUser);
        populateUnitDetailsFromUser(complaint, complaint.getRaisedForUser() != null ? complaint.getRaisedForUser() : assignedUser);
        String beforeStatus = complaint.getStatus();
        if ("PENDING".equalsIgnoreCase(complaint.getStatus())) {
            complaint.setStatus("UNDER_REVIEW");
        }

        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, actor, "ASSIGNED", beforeStatus, saved.getStatus(), "Assigned to " + assignedUser.getName());
        return toResponse(saved);
    }

    @Override
    public ComplaintResponse addRemarks(Long id, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }

        String cleanedRemarks = cleanString(remarks);
        if (cleanedRemarks == null || cleanedRemarks.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Remarks are required");
        }

        complaint.setAdminRemarks(cleanedRemarks);
        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, actor, "REMARKS_ADDED", null, saved.getStatus(), cleanedRemarks);
        return toResponse(saved);
    }

    @Override
    public ComplaintAttachmentUploadResponse uploadAttachment(Long userId, Long societyId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attachment file is required");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "File rejected: Maximum upload size is 25MB.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        roleService.enforceSocietyScope(user, society.getId());

        String originalName = cleanString(file.getOriginalFilename());
        if (originalName == null) {
            originalName = "attachment";
        }

        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String extension = "";
        int dot = safeName.lastIndexOf('.');
        if (dot >= 0 && dot < safeName.length() - 1) {
            extension = safeName.substring(dot);
        }

        String storedFileName = UUID.randomUUID() + extension;
        byte[] fileData;
        try {
            fileData = file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read uploaded attachment");
        }

        ComplaintUpload upload = new ComplaintUpload();
        upload.setSociety(society);
        upload.setUploadedBy(user);
        upload.setOriginalFileName(originalName);
        upload.setStoredFileName(storedFileName);
        upload.setContentType(cleanString(file.getContentType()));
        upload.setFileSize(file.getSize());
        upload.setFileData(fileData);
        ComplaintUpload saved = complaintUploadRepository.save(upload);

        String url = "/complaints/attachments/" + saved.getId() + "?userId=" + userId;

        return new ComplaintAttachmentUploadResponse(
                saved.getId(),
                saved.getOriginalFileName(),
                saved.getContentType(),
                saved.getFileSize(),
                url
        );
    }

    @Override
    public List<ComplaintCommentResponse> getComments(Long complaintId, Long userId) {
        Complaint complaint = getComplaintForUserScope(complaintId, userId, false);
        return complaintCommentRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId()).stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintCommentResponse addComment(Long complaintId, Long userId, String message) {
        Complaint complaint = getComplaintForUserScope(complaintId, userId, false);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (isRestrictedMemberDirectCommunication(user, complaint.getCategory())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                "One-to-one communication is allowed only during office timings. Outside office timings, please raise a ticket for your request or issue.");
        }

        String cleaned = cleanString(message);
        if (cleaned == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Comment is required");
        }

        ComplaintComment comment = new ComplaintComment();
        comment.setComplaint(complaint);
        comment.setUser(user);
        comment.setMessage(cleaned);
        ComplaintComment saved = complaintCommentRepository.save(comment);

        appendHistory(complaint, user, "COMMENT_ADDED", null, complaint.getStatus(), cleaned);
        return toCommentResponse(saved);
    }

    @Override
    public List<ComplaintHistoryResponse> getHistory(Long complaintId, Long userId) {
        Complaint complaint = getComplaintForUserScope(complaintId, userId, false);
        return complaintHistoryRepository.findByComplaintIdOrderByCreatedAtDesc(complaint.getId()).stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintSlaSummaryResponse getSlaSummary(Long societyId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        roleService.enforceSocietyScope(user, societyId);

        List<Complaint> openComplaints = complaintRepository.findBySocietyId(societyId).stream()
                .filter(this::isVisibleForListing)
                .filter(complaint -> !"RESOLVED".equalsIgnoreCase(complaint.getStatus()))
                .filter(complaint -> !"REJECTED".equalsIgnoreCase(complaint.getStatus()))
                .collect(Collectors.toList());

        long dueSoon = 0;
        long breached = 0;
        long highRisk = 0;

        for (Complaint complaint : openComplaints) {
            SlaComputation sla = computeSla(complaint);
            if (sla.breached) {
                breached++;
            } else if (sla.remainingMinutes != null && sla.remainingMinutes <= DUE_SOON_THRESHOLD_MINUTES) {
                dueSoon++;
            }
            if ("AT_RISK".equals(sla.escalationLevel) || "BREACHED".equals(sla.escalationLevel)) {
                highRisk++;
            }
        }

        return new ComplaintSlaSummaryResponse(openComplaints.size(), dueSoon, breached, highRisk);
    }

    @Override
    public ComplaintResponse undo(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();

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
            appendHistory(saved, actor, "DELETE_UNDONE", "DELETED", saved.getStatus(), "Delete action reverted");
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
            appendHistory(saved, actor, "STATUS_UNDONE", null, saved.getStatus(), "Status change reverted");
            return toResponse(saved);
        }

        throw new ApiException(HttpStatus.CONFLICT, "No undo action available or undo window has expired");
    }

    @Override
    public void delete(Long id, boolean force) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User actor = roleService.getCurrentUser();

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

        Complaint saved = complaintRepository.save(complaint);
        appendHistory(saved, actor, "DELETED_SOFT", saved.getDeleteUndoPreviousStatus(), "DELETED", "Complaint soft deleted");
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
        response.setPriority(complaint.getPriority());
        response.setWing(complaint.getWing());
        response.setFloor(complaint.getFloor());
        response.setFlatNumber(complaint.getFlatNumber());
        response.setLocationDetails(complaint.getLocationDetails());
        response.setAttachmentUrls(complaint.getAttachmentUrls());
        response.setAdminRemarks(complaint.getAdminRemarks());
        response.setRaisedForReason(complaint.getRaisedForReason());
        if (complaint.getAssignedToUser() != null) {
            response.setAssignedToUserId(complaint.getAssignedToUser().getId());
            response.setAssignedToName(complaint.getAssignedToUser().getName());
        }
        if (complaint.getRaisedForUser() != null) {
            response.setRaisedForUserId(complaint.getRaisedForUser().getId());
            response.setRaisedForName(complaint.getRaisedForUser().getName());
        }
        response.setStatus(complaint.getStatus());
        response.setResolution(complaint.getResolution());
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        response.setResolvedAt(complaint.getResolvedAt());

        SlaComputation sla = computeSla(complaint);
        response.setSlaDueAt(sla.dueAt);
        response.setSlaRemainingMinutes(sla.remainingMinutes);
        response.setSlaBreached(sla.breached);
        response.setBreachDurationMinutes(sla.breachDurationMinutes);
        response.setEscalationLevel(sla.escalationLevel);

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

    private List<Complaint> sortComplaintsByLatest(List<Complaint> complaints) {
        if (complaints == null || complaints.isEmpty()) {
            return List.of();
        }

        return complaints.stream()
                .sorted(Comparator
                        .comparing(Complaint::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Complaint::getId, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .collect(Collectors.toList());
    }

    private boolean isUndoWindowOpen(LocalDateTime expiry, LocalDateTime now) {
        return expiry != null && (expiry.isAfter(now) || expiry.isEqual(now));
    }

    private String normalizeCategory(String category) {
        String value = category == null ? "OTHER" : category.trim().toUpperCase();
        if (value.equals("NEIGHBOR")) {
            value = "NEIGHBOR_ISSUE";
        }
        if (!ALLOWED_CATEGORIES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid category");
        }
        return value;
    }

    private String normalizePriority(String priority) {
        String value = priority == null ? "MEDIUM" : priority.trim().toUpperCase();
        if (!ALLOWED_PRIORITIES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid priority");
        }
        return value;
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toUpperCase();
        if (value.isBlank() || !ALLOWED_STATUSES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        return value;
    }

    private List<String> normalizeAttachmentUrls(List<String> attachmentUrls) {
        if (attachmentUrls == null || attachmentUrls.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> cleaned = attachmentUrls.stream()
                .map(this::cleanString)
                .filter(url -> url != null && !url.isBlank())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());

        return new ArrayList<>(cleaned);
    }

    private String cleanString(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private boolean canManageAdvancedComplaintFields(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return user.getRole() == Role.MASTER_ADMIN || user.getRole() == Role.SOCIETY_ADMIN;
    }

    private boolean hasAdvancedComplaintFieldValues(ComplaintRequest request) {
        if (request == null) {
            return false;
        }
        return request.getAssignedToUserId() != null
                || request.getRaisedForUserId() != null
                || cleanString(request.getRaisedForReason()) != null
                || cleanString(request.getAdminRemarks()) != null;
    }

    private void populateUnitDetailsFromUser(Complaint complaint, User referenceUser) {
        if (referenceUser == null) {
            return;
        }
        Flat flat = referenceUser.getFlat();
        if (flat == null) {
            return;
        }
        complaint.setFlatNumber(cleanString(flat.getFlatNumber()));
        complaint.setFloor(flat.getFloor());
        complaint.setWing(flat.getWing() != null ? cleanString(flat.getWing().getName()) : null);
    }

    private Complaint getComplaintForUserScope(Long complaintId, Long userId, boolean managementOnly) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(user, complaint.getSociety().getId());
        }

        if (managementOnly) {
            roleService.canManageComplaints(userId);
            return complaint;
        }

        boolean isOwner = complaint.getUser() != null && complaint.getUser().getId().equals(userId);
        boolean isAssignedTo = complaint.getAssignedToUser() != null
                && complaint.getAssignedToUser().getId().equals(userId);
        boolean isSharedWith = complaint.getRaisedForUser() != null
                && complaint.getRaisedForUser().getId().equals(userId);
        boolean isManager = user.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN
                || user.getRole() == com.society.backend.user.entity.Role.SOCIETY_ADMIN
                || user.getRole() == com.society.backend.user.entity.Role.CHAIRMAN
                || user.getRole() == com.society.backend.user.entity.Role.SECRETARY
                || user.getRole() == com.society.backend.user.entity.Role.TREASURER
                || user.getRole() == com.society.backend.user.entity.Role.COMMITTEE
                || user.getRole() == com.society.backend.user.entity.Role.MANAGER;

        if (!isOwner && !isAssignedTo && !isSharedWith && !isManager) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot access comments/history for this complaint");
        }
        return complaint;
    }

    private boolean canViewComplaint(User currentUser, Complaint complaint) {
        if (currentUser == null || complaint == null) {
            return false;
        }

        if (currentUser.getRole() != Role.MASTER_ADMIN) {
            if (complaint.getSociety() == null || currentUser.getSociety() == null
                    || !complaint.getSociety().getId().equals(currentUser.getSociety().getId())) {
                return false;
            }
        }

        if (currentUser.getRole() == Role.MEMBER || currentUser.getRole() == Role.TENANT) {
            boolean isOwner = complaint.getUser() != null && currentUser.getId().equals(complaint.getUser().getId());
            boolean isAssignedTo = complaint.getAssignedToUser() != null
                    && currentUser.getId().equals(complaint.getAssignedToUser().getId());
            boolean isSharedWith = complaint.getRaisedForUser() != null
                    && currentUser.getId().equals(complaint.getRaisedForUser().getId());
            return isOwner || isAssignedTo || isSharedWith;
        }

        return true;
    }

    private ComplaintCommentResponse toCommentResponse(ComplaintComment comment) {
        return new ComplaintCommentResponse(
                comment.getId(),
                comment.getComplaint().getId(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getMessage(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    private ComplaintHistoryResponse toHistoryResponse(ComplaintHistory history) {
        return new ComplaintHistoryResponse(
                history.getId(),
                history.getComplaint().getId(),
                history.getActionType(),
                history.getActor() != null ? history.getActor().getName() : "System",
                history.getFromStatus(),
                history.getToStatus(),
                history.getNote(),
                history.getCreatedAt()
        );
    }

    private void appendHistory(Complaint complaint, User actor, String actionType, String fromStatus, String toStatus, String note) {
        // Ensure complaint is managed in the current session
        if (complaint != null && complaint.getId() != null) {
            complaint = entityManager.contains(complaint) ? complaint : entityManager.find(Complaint.class, complaint.getId());
        }
        
        ComplaintHistory history = new ComplaintHistory();
        history.setComplaint(complaint);
        history.setActor(actor);
        history.setActionType(actionType);
        history.setFromStatus(cleanString(fromStatus));
        history.setToStatus(cleanString(toStatus));
        history.setNote(cleanString(note));
        complaintHistoryRepository.save(history);
    }

    private SlaComputation computeSla(Complaint complaint) {
        String priority = complaint.getPriority() == null ? "MEDIUM" : complaint.getPriority().trim().toUpperCase(Locale.ROOT);
        long targetMinutes = SLA_MINUTES_BY_PRIORITY.getOrDefault(priority, SLA_MINUTES_BY_PRIORITY.get("MEDIUM"));
        LocalDateTime dueAt = complaint.getCreatedAt() == null ? null : complaint.getCreatedAt().plusMinutes(targetMinutes);

        boolean closed = "RESOLVED".equalsIgnoreCase(complaint.getStatus()) || "REJECTED".equalsIgnoreCase(complaint.getStatus());

        if (dueAt == null || closed) {
            return new SlaComputation(dueAt, null, false, null, "ON_TRACK");
        }

        LocalDateTime now = LocalDateTime.now();
        long remainingMinutes = java.time.Duration.between(now, dueAt).toMinutes();
        if (remainingMinutes < 0) {
            long breachMinutes = Math.abs(remainingMinutes);
            return new SlaComputation(dueAt, 0L, true, breachMinutes, "BREACHED");
        }

        String escalationLevel = remainingMinutes <= Math.min(DUE_SOON_THRESHOLD_MINUTES, targetMinutes / 4)
                ? "AT_RISK"
                : "ON_TRACK";

        return new SlaComputation(dueAt, remainingMinutes, false, 0L, escalationLevel);
    }

    private static class SlaComputation {
        private final LocalDateTime dueAt;
        private final Long remainingMinutes;
        private final boolean breached;
        private final Long breachDurationMinutes;
        private final String escalationLevel;

        private SlaComputation(LocalDateTime dueAt, Long remainingMinutes, boolean breached, Long breachDurationMinutes, String escalationLevel) {
            this.dueAt = dueAt;
            this.remainingMinutes = remainingMinutes;
            this.breached = breached;
            this.breachDurationMinutes = breachDurationMinutes;
            this.escalationLevel = escalationLevel;
        }
    }

    private String toOffsetIsoDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }

    private boolean isWithinMemberOfficeHours() {
        ZoneId zone = parseZone(memberOfficeHoursZone);
        ZonedDateTime now = ZonedDateTime.now(zone);

        Set<DayOfWeek> allowedDays = parseOfficeDays(memberOfficeHoursDays);
        if (!allowedDays.contains(now.getDayOfWeek())) {
            return false;
        }

        LocalTime nowTime = now.toLocalTime();
        LocalTime start = parseOfficeTime(memberOfficeHoursStart, LocalTime.of(9, 30));
        LocalTime end = parseOfficeTime(memberOfficeHoursEnd, LocalTime.of(18, 30));

        if (end.isAfter(start) || end.equals(start)) {
            return !nowTime.isBefore(start) && !nowTime.isAfter(end);
        }

        // Supports overnight windows such as 22:00 -> 06:00.
        return !nowTime.isBefore(start) || !nowTime.isAfter(end);
    }

    private LocalTime parseOfficeTime(String value, LocalTime fallback) {
        try {
            return LocalTime.parse(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private ZoneId parseZone(String value) {
        try {
            return ZoneId.of(value);
        } catch (Exception ignored) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    private Set<DayOfWeek> parseOfficeDays(String value) {
        if (value == null || value.isBlank()) {
            return Set.of(
                    DayOfWeek.MONDAY,
                    DayOfWeek.TUESDAY,
                    DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY,
                    DayOfWeek.FRIDAY,
                    DayOfWeek.SATURDAY
            );
        }

        Set<DayOfWeek> parsed = Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .map(token -> {
                    try {
                        return DayOfWeek.valueOf(token.toUpperCase(Locale.ROOT));
                    } catch (Exception ignored) {
                        return null;
                    }
                })
                .filter(day -> day != null)
                .collect(Collectors.toSet());

        if (parsed.isEmpty()) {
            return Set.of(
                    DayOfWeek.MONDAY,
                    DayOfWeek.TUESDAY,
                    DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY,
                    DayOfWeek.FRIDAY,
                    DayOfWeek.SATURDAY
            );
        }

        return parsed;
    }

    private boolean isRestrictedMemberDirectCommunication(User user, String complaintCategory) {
        if (user == null || user.getRole() == null) {
            return false;
        }

        if (!MEMBER_DIRECT_COMMUNICATION_ROLES.contains(user.getRole())) {
            return false;
        }

        if (!isDirectCommunicationComplaintCategory(complaintCategory)) {
            return false;
        }

        return !isWithinMemberOfficeHours();
    }

    private boolean isDirectCommunicationComplaintCategory(String category) {
        String normalized = normalizeCategory(category);
        Set<String> restrictedCategories = Arrays.stream(memberDirectComplaintCategories.split(","))
                .map(String::trim)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());

        if (restrictedCategories.isEmpty()) {
            return true;
        }

        return restrictedCategories.contains(normalized);
    }

}
