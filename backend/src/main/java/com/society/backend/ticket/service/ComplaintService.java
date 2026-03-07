package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.request.ComplaintRequest;
import com.society.backend.ticket.dto.response.ComplaintResponse;

import java.util.List;

public interface ComplaintService {
    ComplaintResponse create(Long userId, ComplaintRequest request);

    List<ComplaintResponse> getAll(Long userId);

    List<ComplaintResponse> getBySociety(Long societyId);

    List<ComplaintResponse> getByUser(Long userId);

    List<ComplaintResponse> getByStatus(String status);

    ComplaintResponse getById(Long id);

    ComplaintResponse updateStatus(Long id, String status, String resolution);

    void delete(Long id);
}
