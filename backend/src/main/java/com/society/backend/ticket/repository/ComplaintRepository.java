package com.society.backend.ticket.repository;

import com.society.backend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserId(Long userId);

    List<Complaint> findByStatus(String status);

    List<Complaint> findBySocietyId(Long societyId);
}
