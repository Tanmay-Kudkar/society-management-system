package com.society.backend.security.repository;

import com.society.backend.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {
    List<Visitor> findBySocietyId(Long societyId);
    List<Visitor> findByFlatId(Long flatId);
    List<Visitor> findByStatus(String status);
    List<Visitor> findBySocietyIdAndStatus(Long societyId, String status);
    List<Visitor> findByVisitorType(String visitorType);
    List<Visitor> findByApprovalCode(String approvalCode);
    List<Visitor> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
    List<Visitor> findBySocietyIdAndExpectedArrivalBetweenOrderByExpectedArrivalAsc(
            Long societyId,
            LocalDateTime start,
            LocalDateTime end
    );
    List<Visitor> findBySocietyIdAndStatusAndCheckInTimeBeforeOrderByCheckInTimeAsc(
            Long societyId,
            String status,
            LocalDateTime checkInBefore
    );
}
