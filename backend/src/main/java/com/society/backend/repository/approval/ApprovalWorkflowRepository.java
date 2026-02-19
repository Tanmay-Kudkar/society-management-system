package com.society.backend.repository.approval;

import com.society.backend.entity.ApprovalWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalWorkflowRepository extends JpaRepository<ApprovalWorkflow, Long> {
    List<ApprovalWorkflow> findBySocietyId(Long societyId);
    List<ApprovalWorkflow> findBySocietyIdAndEntityType(Long societyId, String entityType);
    List<ApprovalWorkflow> findBySocietyIdAndIsActiveTrue(Long societyId);
    List<ApprovalWorkflow> findBySocietyIdAndEntityTypeAndIsActiveTrue(Long societyId, String entityType);
}
