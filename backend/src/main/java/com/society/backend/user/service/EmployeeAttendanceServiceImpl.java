package com.society.backend.user.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.service.RoleService;
import com.society.backend.user.dto.request.EmployeeAttendanceRequest;
import com.society.backend.user.dto.response.EmployeeAttendanceResponse;
import com.society.backend.user.entity.Employee;
import com.society.backend.user.entity.EmployeeAttendance;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.EmployeeAttendanceRepository;
import com.society.backend.user.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeAttendanceServiceImpl implements EmployeeAttendanceService {

    private static final Set<String> ALLOWED_STATUS = Set.of("PRESENT", "ABSENT", "HALF_DAY", "LEAVE");

    private final EmployeeRepository employeeRepository;
    private final EmployeeAttendanceRepository employeeAttendanceRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public EmployeeAttendanceResponse markAttendance(Long employeeId, EmployeeAttendanceRequest request, Long requesterId) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        if (!Boolean.TRUE.equals(employee.getIsActive())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot mark attendance for inactive employee");
        }

        String normalizedStatus = normalizeStatus(request.getStatus());

        EmployeeAttendance attendance = employeeAttendanceRepository
                .findByEmployeeIdAndAttendanceDate(employeeId, request.getAttendanceDate())
                .orElseGet(EmployeeAttendance::new);

        attendance.setEmployee(employee);
        attendance.setSociety(employee.getSociety());
        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setStatus(normalizedStatus);
        attendance.setCheckInTime(request.getCheckInTime());
        attendance.setCheckOutTime(request.getCheckOutTime());
        attendance.setRemarks(request.getRemarks());
        attendance.setMarkedBy(requester);

        EmployeeAttendance saved = employeeAttendanceRepository.save(attendance);
        log.info("User {} marked attendance for employee {} on {} as {}", requesterId, employeeId, request.getAttendanceDate(), normalizedStatus);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeAttendanceResponse> getBySociety(
            Long societyId,
            LocalDate fromDate,
            LocalDate toDate,
            String status,
            Pageable pageable,
            Long requesterId
    ) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);
        roleService.enforceSocietyScope(requester, societyId);

        LocalDate safeFrom = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate safeTo = toDate != null ? toDate : LocalDate.now();
        validateDateRange(safeFrom, safeTo);

        Page<EmployeeAttendance> page;
        if (status != null && !status.isBlank()) {
            page = employeeAttendanceRepository.findBySocietyIdAndAttendanceDateBetweenAndStatus(
                    societyId,
                    safeFrom,
                    safeTo,
                    normalizeStatus(status),
                    pageable
            );
        } else {
            page = employeeAttendanceRepository.findBySocietyIdAndAttendanceDateBetween(societyId, safeFrom, safeTo, pageable);
        }

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeAttendanceResponse> getByEmployee(Long employeeId, LocalDate fromDate, LocalDate toDate, Long requesterId) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        LocalDate safeFrom = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate safeTo = toDate != null ? toDate : LocalDate.now();
        validateDateRange(safeFrom, safeTo);

        return employeeAttendanceRepository
                .findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(employeeId, safeFrom, safeTo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getSummary(Long societyId, LocalDate fromDate, LocalDate toDate, Long requesterId) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);
        roleService.enforceSocietyScope(requester, societyId);

        LocalDate safeFrom = fromDate != null ? fromDate : LocalDate.now().withDayOfMonth(1);
        LocalDate safeTo = toDate != null ? toDate : LocalDate.now();
        validateDateRange(safeFrom, safeTo);

        Map<String, Long> summary = new HashMap<>();
        summary.put("total", employeeAttendanceRepository.countBySocietyIdAndAttendanceDateBetween(societyId, safeFrom, safeTo));
        summary.put("present", employeeAttendanceRepository.countBySocietyIdAndAttendanceDateBetweenAndStatus(societyId, safeFrom, safeTo, "PRESENT"));
        summary.put("absent", employeeAttendanceRepository.countBySocietyIdAndAttendanceDateBetweenAndStatus(societyId, safeFrom, safeTo, "ABSENT"));
        summary.put("halfDay", employeeAttendanceRepository.countBySocietyIdAndAttendanceDateBetweenAndStatus(societyId, safeFrom, safeTo, "HALF_DAY"));
        summary.put("leave", employeeAttendanceRepository.countBySocietyIdAndAttendanceDateBetweenAndStatus(societyId, safeFrom, safeTo, "LEAVE"));
        return summary;
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate.isAfter(toDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate must be before or equal to toDate");
        }
    }

    private String normalizeStatus(String rawStatus) {
        if (rawStatus == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attendance status is required");
        }
        String normalized = rawStatus.trim().toUpperCase();
        if (!ALLOWED_STATUS.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid attendance status. Allowed: PRESENT, ABSENT, HALF_DAY, LEAVE");
        }
        return normalized;
    }

    private EmployeeAttendanceResponse toResponse(EmployeeAttendance attendance) {
        return EmployeeAttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeCode(attendance.getEmployee().getEmployeeCode())
                .employeeUserId(attendance.getEmployee().getUser().getId())
                .employeeName(attendance.getEmployee().getUser().getName())
                .societyId(attendance.getSociety().getId())
                .attendanceDate(attendance.getAttendanceDate())
                .status(attendance.getStatus())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .remarks(attendance.getRemarks())
                .markedById(attendance.getMarkedBy() != null ? attendance.getMarkedBy().getId() : null)
                .markedByName(attendance.getMarkedBy() != null ? attendance.getMarkedBy().getName() : null)
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }
}
