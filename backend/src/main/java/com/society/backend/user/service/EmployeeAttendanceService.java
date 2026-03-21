package com.society.backend.user.service;

import com.society.backend.user.dto.request.EmployeeAttendanceRequest;
import com.society.backend.user.dto.response.EmployeeAttendanceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface EmployeeAttendanceService {

    EmployeeAttendanceResponse markAttendance(Long employeeId, EmployeeAttendanceRequest request, Long requesterId);

    Page<EmployeeAttendanceResponse> getBySociety(
            Long societyId,
            LocalDate fromDate,
            LocalDate toDate,
            String status,
            Pageable pageable,
            Long requesterId
    );

    List<EmployeeAttendanceResponse> getByEmployee(Long employeeId, LocalDate fromDate, LocalDate toDate, Long requesterId);

    Map<String, Long> getSummary(Long societyId, LocalDate fromDate, LocalDate toDate, Long requesterId);
}
