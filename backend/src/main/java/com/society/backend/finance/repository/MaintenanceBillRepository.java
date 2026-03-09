package com.society.backend.finance.repository;

import com.society.backend.finance.entity.MaintenanceBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceBillRepository extends JpaRepository<MaintenanceBill, Long> {
    List<MaintenanceBill> findByFlatId(Long flatId);

    List<MaintenanceBill> findByBillMonth(String billMonth);

    List<MaintenanceBill> findByStatus(String status);

    Optional<MaintenanceBill> findByFlatIdAndBillMonth(Long flatId, String billMonth);

    List<MaintenanceBill> findBySocietyId(Long societyId);

    List<MaintenanceBill> findBySocietyIdAndStatus(Long societyId, String status);

    List<MaintenanceBill> findBySocietyIdAndStatusNot(Long societyId, String status);
}
