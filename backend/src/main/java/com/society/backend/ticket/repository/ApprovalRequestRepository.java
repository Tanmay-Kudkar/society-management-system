package com.society.backend.ticket.repository;

import com.society.backend.ticket.entity.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    List<ApprovalRequest> findBySocietyId(Long societyId);
    List<ApprovalRequest> findBySocietyIdAndStatus(Long societyId, String status);
    List<ApprovalRequest> findBySocietyIdAndEntityType(Long societyId, String entityType);
    List<ApprovalRequest> findByRequestedById(Long userId);
    List<ApprovalRequest> findByEntityTypeAndEntityId(String entityType, Long entityId);
    List<ApprovalRequest> findBySocietyIdAndEntityTypeAndStatus(Long societyId, String entityType, String status);
}
