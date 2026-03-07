package com.society.backend.security.repository;

import com.society.backend.security.entity.PatrolCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatrolCheckpointRepository extends JpaRepository<PatrolCheckpoint, Long> {
    List<PatrolCheckpoint> findBySocietyIdAndIsActiveTrueOrderByDisplayOrderAsc(Long societyId);
    List<PatrolCheckpoint> findBySocietyIdOrderByDisplayOrderAsc(Long societyId);
}
