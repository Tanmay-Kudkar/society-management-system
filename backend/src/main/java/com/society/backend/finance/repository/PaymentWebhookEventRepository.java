package com.society.backend.finance.repository;

import com.society.backend.finance.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {
	List<PaymentWebhookEvent> findAllByOrderByReceivedAtDesc(Pageable pageable);
}
