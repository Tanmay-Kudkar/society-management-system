package com.society.backend.vendor.repository;

import com.society.backend.vendor.entity.StaffAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {
    List<StaffAttendance> findByStaffId(Long staffId);
    List<StaffAttendance> findBySocietyId(Long societyId);
    List<StaffAttendance> findByStaffIdAndAttendanceDateBetween(Long staffId, LocalDate start, LocalDate end);
    List<StaffAttendance> findBySocietyIdAndAttendanceDate(Long societyId, LocalDate date);
    List<StaffAttendance> findByFlatId(Long flatId);
}
