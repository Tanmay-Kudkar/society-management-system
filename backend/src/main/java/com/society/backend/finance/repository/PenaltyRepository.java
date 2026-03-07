package com.society.backend.finance.repository;

import com.society.backend.finance.entity.Penalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    List<Penalty> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
    List<Penalty> findBySocietyIdAndStatusOrderByCreatedAtDesc(Long societyId, String status);
    List<Penalty> findBySocietyIdAndPaymentStatusOrderByCreatedAtDesc(Long societyId, String paymentStatus);
    List<Penalty> findBySocietyIdAndPenaltyTypeOrderByCreatedAtDesc(Long societyId, String penaltyType);
    List<Penalty> findByIssuedToIdOrderByCreatedAtDesc(Long issuedToId);
    long countBySocietyIdAndStatus(Long societyId, String status);
    long countBySocietyIdAndPaymentStatus(Long societyId, String paymentStatus);
}
