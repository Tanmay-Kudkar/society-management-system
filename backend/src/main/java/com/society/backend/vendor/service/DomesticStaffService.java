package com.society.backend.vendor.service;

import com.society.backend.vendor.dto.request.DomesticStaffRequest;
import com.society.backend.vendor.dto.response.DomesticStaffResponse;
import com.society.backend.vendor.dto.request.StaffAttendanceRequest;
import com.society.backend.vendor.dto.response.StaffAttendanceResponse;

import java.time.LocalDate;
import java.util.List;

public interface DomesticStaffService {
    // Staff management
    DomesticStaffResponse createStaff(Long userId, DomesticStaffRequest request);
    List<DomesticStaffResponse> getAllStaff(Long userId);
    List<DomesticStaffResponse> getStaffBySociety(Long societyId);
    List<DomesticStaffResponse> getActiveStaffBySociety(Long societyId);
    List<DomesticStaffResponse> getStaffByType(Long societyId, String staffType);
    DomesticStaffResponse getStaffById(Long id);
    DomesticStaffResponse updateStaff(Long id, DomesticStaffRequest request);
    DomesticStaffResponse toggleStaffStatus(Long id);
    DomesticStaffResponse verifyStaff(Long id, Long userId);
    void deleteStaff(Long id);

    // Attendance management
    StaffAttendanceResponse recordAttendance(Long userId, StaffAttendanceRequest request);
    List<StaffAttendanceResponse> getAttendanceBySociety(Long societyId, LocalDate date);
    List<StaffAttendanceResponse> getAttendanceByStaff(Long staffId, LocalDate startDate, LocalDate endDate);
    List<StaffAttendanceResponse> getAttendanceByFlat(Long flatId);
    StaffAttendanceResponse markCheckOut(Long attendanceId);
}
