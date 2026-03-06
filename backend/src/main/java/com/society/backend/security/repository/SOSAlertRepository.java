package com.society.backend.security.repository;

import com.society.backend.entity.SOSAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SOSAlertRepository extends JpaRepository<SOSAlert, Long> {
    List<SOSAlert> findBySocietyId(Long societyId);
    List<SOSAlert> findByRaisedById(Long userId);
    List<SOSAlert> findByStatus(String status);
    List<SOSAlert> findBySocietyIdAndStatus(Long societyId, String status);
    List<SOSAlert> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
    List<SOSAlert> findBySocietyIdAndPriorityOrderByCreatedAtDesc(Long societyId, String priority);
    List<SOSAlert> findBySocietyIdAndStatusInOrderByCreatedAtDesc(Long societyId, List<String> statuses);
    long countBySocietyIdAndStatus(Long societyId, String status);
    long countBySocietyIdAndStatusIn(Long societyId, List<String> statuses);
}
