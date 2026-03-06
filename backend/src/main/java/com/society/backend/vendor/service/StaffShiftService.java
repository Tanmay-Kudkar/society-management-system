package com.society.backend.vendor.service;

import com.society.backend.dto.request.StaffShiftRequest;
import com.society.backend.dto.response.StaffShiftResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface StaffShiftService {
    StaffShiftResponse create(Long userId, StaffShiftRequest request);
    StaffShiftResponse getById(Long id, Long userId);
    List<StaffShiftResponse> getBySociety(Long societyId, Long userId);
    List<StaffShiftResponse> getByDate(Long societyId, LocalDate date, Long userId);
    List<StaffShiftResponse> getByStatus(Long societyId, String status, Long userId);
    List<StaffShiftResponse> getByStaff(Long staffUserId, Long userId);
    List<StaffShiftResponse> getByDateRange(Long societyId, LocalDate start, LocalDate end, Long userId);
    StaffShiftResponse checkIn(Long id, Long userId);
    StaffShiftResponse checkOut(Long id, Long userId);
    StaffShiftResponse markAbsent(Long id, Long userId);
    Map<String, Long> getDayCounts(Long societyId, LocalDate date, Long userId);
    void delete(Long id, Long userId);
}
