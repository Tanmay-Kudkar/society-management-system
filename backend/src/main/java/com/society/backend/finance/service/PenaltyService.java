package com.society.backend.finance.service;

import com.society.backend.dto.request.PenaltyRequest;
import com.society.backend.dto.response.PenaltyResponse;
import java.util.List;
import java.util.Map;

public interface PenaltyService {
    PenaltyResponse create(PenaltyRequest request, Long userId);
    PenaltyResponse update(Long id, PenaltyRequest request, Long userId);
    PenaltyResponse getById(Long id, Long userId);
    List<PenaltyResponse> getBySociety(Long societyId, Long userId);
    List<PenaltyResponse> getByStatus(Long societyId, String status, Long userId);
    List<PenaltyResponse> getByPaymentStatus(Long societyId, String paymentStatus, Long userId);
    List<PenaltyResponse> getByType(Long societyId, String penaltyType, Long userId);
    List<PenaltyResponse> getByUser(Long issuedToId, Long userId);
    PenaltyResponse markPaid(Long id, Long userId);
    PenaltyResponse waive(Long id, String reason, Long userId);
    PenaltyResponse appeal(Long id, String notes, Long userId);
    Map<String, Long> getCounts(Long societyId, Long userId);
    void delete(Long id, Long userId);
}
