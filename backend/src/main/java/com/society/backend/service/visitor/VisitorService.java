package com.society.backend.service.visitor;

import com.society.backend.dto.visitor.VisitorRequest;
import com.society.backend.dto.visitor.VisitorResponse;

import java.time.LocalDate;
import java.util.List;

public interface VisitorService {
    VisitorResponse create(Long userId, VisitorRequest request);
    List<VisitorResponse> getAll(Long userId);
    List<VisitorResponse> getBySociety(Long societyId);
    List<VisitorResponse> getTodayArrivals(Long societyId, Long userId);
    List<VisitorResponse> getOverstayed(Long societyId, Long userId, Integer thresholdHours);
    List<VisitorResponse> getBySocietyAndDateRange(Long societyId, Long userId, LocalDate fromDate, LocalDate toDate);
    List<VisitorResponse> getByFlat(Long flatId);
    List<VisitorResponse> getByStatus(String status);
    List<VisitorResponse> getByType(String visitorType);
    VisitorResponse getById(Long id);
    VisitorResponse checkIn(Long id, Long userId);
    VisitorResponse checkOut(Long id, Long userId);
    VisitorResponse generateOtp(Long id, Long userId);
    VisitorResponse verifyOtp(Long id, Long userId, String otpCode);
    VisitorResponse updateStatus(Long id, String status, Long userId);
    void delete(Long id, Long userId);
}
