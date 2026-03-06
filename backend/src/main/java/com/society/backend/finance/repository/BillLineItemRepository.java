package com.society.backend.finance.repository;

import com.society.backend.entity.BillLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillLineItemRepository extends JpaRepository<BillLineItem, Long> {

    List<BillLineItem> findByBillIdOrderByCreatedAtAsc(Long billId);

    @Modifying
    @Query("DELETE FROM BillLineItem b WHERE b.bill.id = :billId")
    void deleteByBillId(Long billId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BillLineItem b WHERE b.bill.id = :billId")
    java.math.BigDecimal sumAmountByBillId(Long billId);
}
