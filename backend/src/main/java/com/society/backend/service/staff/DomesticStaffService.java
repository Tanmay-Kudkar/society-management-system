package com.society.backend.service.staff;

import com.society.backend.dto.staff.DomesticStaffRequest;
import com.society.backend.dto.staff.DomesticStaffResponse;
import com.society.backend.dto.staff.StaffAttendanceRequest;
import com.society.backend.dto.staff.StaffAttendanceResponse;

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
