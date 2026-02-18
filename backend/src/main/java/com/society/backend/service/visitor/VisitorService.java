package com.society.backend.service.visitor;

import com.society.backend.dto.visitor.VisitorRequest;
import com.society.backend.dto.visitor.VisitorResponse;

import java.util.List;

public interface VisitorService {
    VisitorResponse create(Long userId, VisitorRequest request);
    List<VisitorResponse> getAll(Long userId);
    List<VisitorResponse> getBySociety(Long societyId);
    List<VisitorResponse> getByFlat(Long flatId);
    List<VisitorResponse> getByStatus(String status);
    List<VisitorResponse> getByType(String visitorType);
    VisitorResponse getById(Long id);
    VisitorResponse checkIn(Long id, Long userId);
    VisitorResponse checkOut(Long id, Long userId);
    VisitorResponse updateStatus(Long id, String status, Long userId);
    void delete(Long id);
}
