package com.society.backend.ticket.controller;

import com.society.backend.ticket.dto.request.ComplaintRequest;
import com.society.backend.ticket.dto.request.ComplaintAssignRequest;
import com.society.backend.ticket.dto.request.ComplaintCommentRequest;
import com.society.backend.ticket.dto.request.ComplaintRemarksRequest;
import com.society.backend.ticket.dto.response.ComplaintAttachmentUploadResponse;
import com.society.backend.ticket.dto.response.ComplaintCommentResponse;
import com.society.backend.ticket.dto.response.ComplaintHistoryResponse;
import com.society.backend.ticket.dto.response.ComplaintResponse;
import com.society.backend.ticket.dto.response.ComplaintSlaSummaryResponse;
import com.society.backend.common.exception.ApiException;
import com.society.backend.ticket.entity.ComplaintUpload;
import com.society.backend.ticket.repository.ComplaintUploadRepository;
import com.society.backend.ticket.service.ComplaintService;
import com.society.backend.common.service.RoleService;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@RestController
@RequestMapping("/complaints")
@PreAuthorize("isAuthenticated()")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final RoleService roleService;
    private final ComplaintUploadRepository complaintUploadRepository;
    private final UserRepository userRepository;

    public ComplaintController(ComplaintService complaintService,
            RoleService roleService,
            ComplaintUploadRepository complaintUploadRepository,
            UserRepository userRepository) {
        this.complaintService = complaintService;
        this.roleService = roleService;
        this.complaintUploadRepository = complaintUploadRepository;
        this.userRepository = userRepository;
    }

    // All registered users can raise complaints (MASTER_ADMIN to TENANT)
    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRequest request) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.create(userId, request));
    }

    // Only management can view all complaints
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAll(@RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getAll(userId));
    }

    // Users can view their own complaints, management can view anyone's
    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<ComplaintResponse>> getByUser(
            @PathVariable Long targetUserId,
            @RequestParam Long userId) {
        // User can view their own, or management can view anyone's
        if (!userId.equals(targetUserId)) {
            roleService.canManageComplaints(userId);
        }
        return ResponseEntity.ok(complaintService.getByUser(targetUserId));
    }

    // Management can filter by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getByStatus(status));
    }

    // Get complaints for a specific society
    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<ComplaintResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getById(id));
    }

    // Management can edit complaint details
    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRequest request) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.update(id, request));
    }

    // Management can update status
    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String status,
            @RequestParam(required = false) String resolution) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.updateStatus(id, status, resolution));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assign(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintAssignRequest request) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.assign(id, request.getAssignedToUserId()));
    }

    @PatchMapping("/{id}/remarks")
    public ResponseEntity<ComplaintResponse> addRemarks(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRemarksRequest request) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.addRemarks(id, request.getRemarks()));
    }

    @PostMapping(path = "/attachments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintAttachmentUploadResponse> uploadAttachment(
            @RequestParam Long userId,
            @RequestParam Long societyId,
            @RequestParam("file") MultipartFile file) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.uploadAttachment(userId, societyId, file));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestParam Long userId) {
        User requester = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        ComplaintUpload upload = complaintUploadRepository.findById(attachmentId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attachment not found"));

        roleService.enforceSocietyScope(requester, upload.getSociety().getId());

        if (upload.getFileData() == null || upload.getFileData().length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = upload.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : upload.getContentType();
        Resource resource = new ByteArrayResource(upload.getFileData());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + upload.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ComplaintCommentResponse>> getComments(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.getComments(id, userId));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ComplaintCommentResponse> addComment(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintCommentRequest request) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.addComment(id, userId, request.getMessage()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ComplaintHistoryResponse>> getHistory(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canRaiseComplaints(userId);
        return ResponseEntity.ok(complaintService.getHistory(id, userId));
    }

    @GetMapping("/society/{societyId}/sla-summary")
    public ResponseEntity<ComplaintSlaSummaryResponse> getSlaSummary(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.getSlaSummary(societyId, userId));
    }

    @PatchMapping("/{id}/undo")
    public ResponseEntity<ComplaintResponse> undo(
            @PathVariable Long id,
            @RequestParam Long userId) {
        roleService.canManageComplaints(userId);
        return ResponseEntity.ok(complaintService.undo(id));
    }

    // Management can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean force) {
        roleService.canManageComplaints(userId);
        complaintService.delete(id, force);
        return ResponseEntity.noContent().build();
    }
}
