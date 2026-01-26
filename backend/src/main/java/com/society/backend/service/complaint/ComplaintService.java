package com.society.backend.service.complaint;

import com.society.backend.dto.complaint.ComplaintRequest;
import com.society.backend.dto.complaint.ComplaintResponse;

import java.util.List;

public interface ComplaintService {
    ComplaintResponse create(Long userId, ComplaintRequest request);

    List<ComplaintResponse> getAll();

    List<ComplaintResponse> getByUser(Long userId);

    List<ComplaintResponse> getByStatus(String status);

    ComplaintResponse getById(Long id);

    ComplaintResponse updateStatus(Long id, String status);

    void delete(Long id);
}
