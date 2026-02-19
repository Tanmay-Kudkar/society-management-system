package com.society.backend.repository.workorder;

import com.society.backend.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
    List<WorkOrder> findBySocietyIdAndStatusOrderByCreatedAtDesc(Long societyId, String status);
    List<WorkOrder> findBySocietyIdAndCategoryOrderByCreatedAtDesc(Long societyId, String category);
    List<WorkOrder> findBySocietyIdAndPriorityOrderByCreatedAtDesc(Long societyId, String priority);
    List<WorkOrder> findByAssignedToIdOrderByCreatedAtDesc(Long assignedToId);
    List<WorkOrder> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);
    List<WorkOrder> findByFlatIdOrderByCreatedAtDesc(Long flatId);
    long countBySocietyIdAndStatus(Long societyId, String status);
}
