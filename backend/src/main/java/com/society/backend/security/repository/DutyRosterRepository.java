package com.society.backend.security.repository;

import com.society.backend.entity.DutyRoster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DutyRosterRepository extends JpaRepository<DutyRoster, Long> {
    List<DutyRoster> findBySocietyIdAndDutyDateOrderByShiftStartAsc(Long societyId, LocalDate date);
    List<DutyRoster> findBySocietyIdAndDutyDateBetweenOrderByDutyDateAscShiftStartAsc(
            Long societyId, LocalDate start, LocalDate end);
    List<DutyRoster> findByGuardIdAndDutyDateBetweenOrderByDutyDateAsc(
            Long guardId, LocalDate start, LocalDate end);
    List<DutyRoster> findBySocietyIdAndStatusOrderByDutyDateDesc(Long societyId, String status);
    long countBySocietyIdAndDutyDateAndStatus(Long societyId, LocalDate date, String status);
}
