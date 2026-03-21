package com.society.backend.user.repository;

import com.society.backend.user.entity.EmployeeAttendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeAttendanceRepository extends JpaRepository<EmployeeAttendance, Long> {

    Optional<EmployeeAttendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    Page<EmployeeAttendance> findBySocietyIdAndAttendanceDateBetween(Long societyId, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    Page<EmployeeAttendance> findBySocietyIdAndAttendanceDateBetweenAndStatus(
            Long societyId,
            LocalDate fromDate,
            LocalDate toDate,
            String status,
            Pageable pageable
    );

    List<EmployeeAttendance> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            Long employeeId,
            LocalDate fromDate,
            LocalDate toDate
    );

    long countBySocietyIdAndAttendanceDateBetween(Long societyId, LocalDate fromDate, LocalDate toDate);

    long countBySocietyIdAndAttendanceDateBetweenAndStatus(Long societyId, LocalDate fromDate, LocalDate toDate, String status);
}
