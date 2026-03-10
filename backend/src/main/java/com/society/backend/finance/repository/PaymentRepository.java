package com.society.backend.finance.repository;

import com.society.backend.finance.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByIdAndDeletedAtIsNull(Long id);
    
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findByRazorpayOrderIdAndDeletedAtIsNull(String razorpayOrderId);
    
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    Optional<Payment> findByRazorpayPaymentIdAndDeletedAtIsNull(String razorpayPaymentId);
    
    List<Payment> findByMaintenanceBillIdAndDeletedAtIsNull(Long maintenanceBillId);
    
    List<Payment> findByUserIdAndDeletedAtIsNull(Long userId);
    
    List<Payment> findBySocietyIdAndDeletedAtIsNull(Long societyId);
    
    List<Payment> findByStatusAndDeletedAtIsNull(String status);
    
    List<Payment> findBySocietyIdAndStatusAndDeletedAtIsNull(Long societyId, String status);
    
    List<Payment> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    
    List<Payment> findBySocietyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long societyId);

    List<Payment> findBySocietyIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long societyId);
}
