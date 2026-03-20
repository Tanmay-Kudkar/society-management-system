package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.ComplaintRequest;
import com.society.backend.ticket.dto.response.ComplaintAttachmentUploadResponse;
import com.society.backend.ticket.dto.response.ComplaintCommentResponse;
import com.society.backend.ticket.dto.response.ComplaintHistoryResponse;
import com.society.backend.ticket.dto.response.ComplaintResponse;
import com.society.backend.ticket.dto.response.ComplaintSlaSummaryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ComplaintService {
    ComplaintResponse create(Long userId, ComplaintRequest request);

    List<ComplaintResponse> getAll(Long userId);

    List<ComplaintResponse> getBySociety(Long societyId);

    List<ComplaintResponse> getByUser(Long userId);

    List<ComplaintResponse> getByStatus(String status);

    ComplaintResponse getById(Long id);

    ComplaintResponse update(Long id, ComplaintRequest request);

    ComplaintResponse updateStatus(Long id, String status, String resolution);

    ComplaintResponse assign(Long id, Long assignedToUserId);

    ComplaintResponse addRemarks(Long id, String remarks);

    ComplaintAttachmentUploadResponse uploadAttachment(Long userId, Long societyId, MultipartFile file);

    List<ComplaintCommentResponse> getComments(Long complaintId, Long userId);

    ComplaintCommentResponse addComment(Long complaintId, Long userId, String message);

    List<ComplaintHistoryResponse> getHistory(Long complaintId, Long userId);

    ComplaintSlaSummaryResponse getSlaSummary(Long societyId, Long userId);

    ComplaintResponse undo(Long id);

    void delete(Long id, boolean force);
}
