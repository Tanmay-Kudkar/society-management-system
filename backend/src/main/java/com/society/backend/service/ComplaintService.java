package com.society.backend.service;

import com.society.backend.dto.ComplaintRequest;
import com.society.backend.dto.ComplaintResponse;

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
