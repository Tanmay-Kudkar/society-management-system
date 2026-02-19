package com.society.backend.repository.approval;

import com.society.backend.entity.ApprovalAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalActionRepository extends JpaRepository<ApprovalAction, Long> {
    List<ApprovalAction> findByApprovalRequestId(Long requestId);
    List<ApprovalAction> findByActedById(Long userId);
    List<ApprovalAction> findByApprovalRequestIdOrderByCreatedAtAsc(Long requestId);
}
