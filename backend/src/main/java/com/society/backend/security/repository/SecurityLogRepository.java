package com.society.backend.security.repository;

import com.society.backend.security.entity.SecurityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {
    List<SecurityLog> findBySocietyIdOrderByCreatedAtDesc(Long societyId, Pageable pageable);

    List<SecurityLog> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
}
