package com.society.backend.finance.repository;

import com.society.backend.finance.entity.BillLineItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillLineItemRepository extends JpaRepository<BillLineItem, Long> {
    List<BillLineItem> findByMaintenanceBillIdOrderByDisplayOrderAsc(Long maintenanceBillId);
}