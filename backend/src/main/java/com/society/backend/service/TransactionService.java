package com.society.backend.service;

import com.society.backend.dto.TransactionRequest;
import com.society.backend.dto.TransactionResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface TransactionService {
    TransactionResponse create(TransactionRequest request, Long userId);

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
