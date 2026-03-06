package com.society.backend.flat.service;

import com.society.backend.dto.request.RenovationNocRequest;
import com.society.backend.dto.response.RenovationNocResponse;

import java.util.List;
import java.util.Map;

public interface RenovationNocService {

    RenovationNocResponse create(RenovationNocRequest request, Long userId);

    RenovationNocResponse update(Long id, RenovationNocRequest request, Long userId);

    RenovationNocResponse getById(Long id, Long userId);

    List<RenovationNocResponse> getBySociety(Long societyId, Long userId);

    List<RenovationNocResponse> getByStatus(Long societyId, String status, Long userId);

    List<RenovationNocResponse> getByType(Long societyId, String renovationType, Long userId);

    List<RenovationNocResponse> getByUser(Long requestedById, Long userId);

    RenovationNocResponse approve(Long id, String adminNotes, Long userId);

    RenovationNocResponse reject(Long id, String reason, Long userId);

    RenovationNocResponse markInProgress(Long id, Long userId);

    RenovationNocResponse markCompleted(Long id, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);

    void delete(Long id, Long userId);
}
