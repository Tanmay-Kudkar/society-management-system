package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.TransactionRequest;
import com.society.backend.finance.dto.response.TransactionResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.society.backend.finance.entity.Transaction;
import com.society.backend.user.entity.Role;
public interface TransactionService {
    TransactionResponse create(TransactionRequest request, Long userId);
    
    /**
     * Create a transaction without role check - for system-initiated transactions
     * like auto-generated income from verified online payments.
     */
    TransactionResponse createFromSystem(TransactionRequest request);

    TransactionResponse getById(Long id);

    List<TransactionResponse> getBySocietyId(Long societyId);

    List<TransactionResponse> getByType(String transactionType);

    List<TransactionResponse> getByPaymentMode(String paymentMode);

    List<TransactionResponse> getByDateRange(Long societyId, LocalDate start, LocalDate end);

    List<TransactionResponse> getAll();

    TransactionResponse update(Long id, TransactionRequest request, Long userId);

    void delete(Long id, Long userId);

    // Summary methods
    BigDecimal getTotalIncome(Long societyId);

    BigDecimal getTotalExpense(Long societyId);

    Map<String, BigDecimal> getSummaryByCategory(Long societyId, LocalDate start, LocalDate end);
}
