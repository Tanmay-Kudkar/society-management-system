package com.society.backend.flat.repository;

import com.society.backend.entity.MoveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MoveRecordRepository extends JpaRepository<MoveRecord, Long> {

    List<MoveRecord> findBySocietyIdOrderByMoveDateDesc(Long societyId);

    List<MoveRecord> findBySocietyIdAndMoveTypeOrderByMoveDateDesc(Long societyId, String moveType);

    List<MoveRecord> findBySocietyIdAndStatusOrderByMoveDateDesc(Long societyId, String status);

    List<MoveRecord> findBySocietyIdAndMoveDateOrderByScheduledTime(Long societyId, LocalDate moveDate);

    List<MoveRecord> findByUserIdOrderByMoveDateDesc(Long userId);

    long countBySocietyIdAndStatus(Long societyId, String status);

    long countBySocietyIdAndMoveType(Long societyId, String moveType);
}
