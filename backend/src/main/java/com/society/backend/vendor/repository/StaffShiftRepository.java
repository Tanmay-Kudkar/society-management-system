package com.society.backend.vendor.repository;

import com.society.backend.vendor.entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Long> {

    List<StaffShift> findBySocietyIdOrderByShiftDateDesc(Long societyId);

    List<StaffShift> findBySocietyIdAndShiftDateOrderByStartTimeAsc(Long societyId, LocalDate date);

    List<StaffShift> findBySocietyIdAndStatusOrderByShiftDateDesc(Long societyId, String status);

    List<StaffShift> findByStaffUserIdOrderByShiftDateDesc(Long staffUserId);

    List<StaffShift> findBySocietyIdAndShiftDateBetweenOrderByShiftDateAsc(Long societyId, LocalDate start, LocalDate end);

    long countBySocietyIdAndShiftDateAndStatus(Long societyId, LocalDate date, String status);
}
