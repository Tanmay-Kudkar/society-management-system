package com.society.backend.repository.patrol;

import com.society.backend.entity.PatrolLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PatrolLogRepository extends JpaRepository<PatrolLog, Long> {
    List<PatrolLog> findBySocietyIdOrderByScannedAtDesc(Long societyId);
    List<PatrolLog> findByGuardIdOrderByScannedAtDesc(Long guardId);
    List<PatrolLog> findBySocietyIdAndScannedAtBetweenOrderByScannedAtDesc(
            Long societyId, LocalDateTime start, LocalDateTime end);
    List<PatrolLog> findByGuardIdAndScannedAtBetweenOrderByScannedAtDesc(
            Long guardId, LocalDateTime start, LocalDateTime end);
    long countBySocietyIdAndScannedAtBetween(Long societyId, LocalDateTime start, LocalDateTime end);
}
