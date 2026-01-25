package com.society.backend.controller;

import com.society.backend.dto.TransactionRequest;
import com.society.backend.dto.TransactionResponse;
import com.society.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody TransactionRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<TransactionResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(transactionService.getBySocietyId(societyId));
    }

    @GetMapping("/type/{transactionType}")
    public ResponseEntity<List<TransactionResponse>> getByType(@PathVariable String transactionType) {
        return ResponseEntity.ok(transactionService.getByType(transactionType));
    }

    @GetMapping("/payment-mode/{paymentMode}")
    public ResponseEntity<List<TransactionResponse>> getByPaymentMode(@PathVariable String paymentMode) {
        return ResponseEntity.ok(transactionService.getByPaymentMode(paymentMode));
    }

    @GetMapping("/date-range/{societyId}")
    public ResponseEntity<List<TransactionResponse>> getByDateRange(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(transactionService.getByDateRange(societyId, start, end));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll() {
        return ResponseEntity.ok(transactionService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(transactionService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        transactionService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary/{societyId}")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable Long societyId) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalIncome", transactionService.getTotalIncome(societyId));
        summary.put("totalExpense", transactionService.getTotalExpense(societyId));

        BigDecimal income = transactionService.getTotalIncome(societyId);
        BigDecimal expense = transactionService.getTotalExpense(societyId);
        summary.put("balance", income.subtract(expense));

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/{societyId}/by-category")
    public ResponseEntity<Map<String, BigDecimal>> getSummaryByCategory(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(transactionService.getSummaryByCategory(societyId, start, end));
    }
}
