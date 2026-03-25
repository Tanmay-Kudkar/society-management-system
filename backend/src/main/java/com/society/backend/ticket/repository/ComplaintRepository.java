package com.society.backend.ticket.repository;

import com.society.backend.ticket.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserId(Long userId);

    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Complaint> findByUserIdAndDeletedFalse(Long userId);

    List<Complaint> findByStatus(String status);

    List<Complaint> findBySocietyId(Long societyId);

    List<Complaint> findBySocietyIdAndDeletedFalse(Long societyId);

    List<Complaint> findByDeletedFalse();
}
