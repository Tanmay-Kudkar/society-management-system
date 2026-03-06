package com.society.backend.security.repository;

import com.society.backend.entity.GateLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GateLogRepository extends JpaRepository<GateLog, Long> {
    List<GateLog> findBySocietyId(Long societyId);
    List<GateLog> findByFlatId(Long flatId);
    List<GateLog> findByStatus(String status);
    List<GateLog> findBySocietyIdAndStatus(Long societyId, String status);
    List<GateLog> findBySocietyIdAndStatusOrderByEntryTimeDesc(Long societyId, String status);
    List<GateLog> findByEntryType(String entryType);
    List<GateLog> findBySocietyIdAndEntryTypeOrderByEntryTimeDesc(Long societyId, String entryType);
    List<GateLog> findBySocietyIdAndEntryTimeBetween(Long societyId, LocalDateTime start, LocalDateTime end);
    List<GateLog> findBySocietyIdOrderByEntryTimeDesc(Long societyId);
}
