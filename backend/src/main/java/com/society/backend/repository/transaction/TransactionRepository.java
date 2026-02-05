package com.society.backend.repository.transaction;

import com.society.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySocietyId(Long societyId);

    List<Transaction> findByTransactionType(String transactionType);

    List<Transaction> findByPaymentMode(String paymentMode);

    List<Transaction> findByTransactionDateBetween(LocalDate start, LocalDate end);

    List<Transaction> findBySocietyIdAndTransactionDateBetween(Long societyId, LocalDate start, LocalDate end);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.society.id = :societyId AND t.transactionType = :type")
    BigDecimal sumBySocietyAndType(Long societyId, String type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.society.id = :societyId AND t.transactionType = :type AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumBySocietyTypeAndDateRange(Long societyId, String type, LocalDate start, LocalDate end);
    
    // Find transactions linked to a specific bill
    List<Transaction> findByRelatedBillIdAndRelatedBillType(Long relatedBillId, String relatedBillType);
    
    // Find single transaction linked to a bill (for when only one transaction per bill is expected)
    Optional<Transaction> findFirstByRelatedBillIdAndRelatedBillType(Long relatedBillId, String relatedBillType);
    
    // Delete transactions linked to a specific bill (for cascading deletes)
    void deleteByRelatedBillIdAndRelatedBillType(Long relatedBillId, String relatedBillType);
    
    // Sum of payments for a specific bill type
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.relatedBillId = :billId AND t.relatedBillType = :billType")
    BigDecimal sumByRelatedBill(Long billId, String billType);
}
