package com.society.backend.finance.repository;

import com.society.backend.finance.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    
    List<Payment> findByMaintenanceBillId(Long maintenanceBillId);
    
    List<Payment> findByUserId(Long userId);
    
    List<Payment> findBySocietyId(Long societyId);
    
    List<Payment> findByStatus(String status);
    
    List<Payment> findBySocietyIdAndStatus(Long societyId, String status);
    
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Payment> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
}
