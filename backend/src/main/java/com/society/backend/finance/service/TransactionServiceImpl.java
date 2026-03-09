package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.TransactionRequest;
import com.society.backend.finance.dto.response.TransactionResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.finance.repository.TransactionRepository;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public TransactionResponse create(TransactionRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());

        // Validate: MAINTENANCE income requires flatId
        if ("INCOME".equalsIgnoreCase(request.getTransactionType()) 
                && "MAINTENANCE".equalsIgnoreCase(request.getCategory())) {
            if (request.getFlatId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, 
                    "Unit/Flat is required for maintenance income transactions");
            }
        }

        Transaction transaction = new Transaction();
        transaction.setSociety(society);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setPaymentMode(request.getPaymentMode());
        transaction.setAmount(request.getAmount());
        transaction.setCategory(request.getCategory());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(
                request.getTransactionDate() != null ? request.getTransactionDate() : LocalDate.now());
        transaction.setReferenceNumber(request.getReferenceNumber());
        transaction.setChequeNumber(request.getChequeNumber());
        transaction.setBankName(request.getBankName());
        transaction.setChequeDate(request.getChequeDate());
        transaction.setUpiId(request.getUpiId());
        transaction.setUtrNumber(request.getUtrNumber());
        transaction.setCardType(request.getCardType());
        transaction.setCardLastFourDigits(request.getCardLastFourDigits());
        transaction.setPaymentMonth(request.getPaymentMonth());
        transaction.setLateFee(request.getLateFee());
        transaction.setDiscount(request.getDiscount());
        transaction.setTaxAmount(request.getTaxAmount());
        transaction.setReceiptNumber(request.getReceiptNumber());
        transaction.setInvoiceNumber(request.getInvoiceNumber());
        transaction.setRelatedBillId(request.getRelatedBillId());
        transaction.setRelatedBillType(request.getRelatedBillType());
        transaction.setCreatedBy(userId);
        
        // Set flat if provided
        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit/Flat not found"));
            transaction.setFlat(flat);
        }

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransactionResponse createFromSystem(TransactionRequest request) {
        // No role check - this is for system-initiated transactions 
        // like auto-generated income from verified online payments

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Transaction transaction = new Transaction();
        transaction.setSociety(society);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setPaymentMode(request.getPaymentMode());
        transaction.setAmount(request.getAmount());
        transaction.setCategory(request.getCategory());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(
                request.getTransactionDate() != null ? request.getTransactionDate() : LocalDate.now());
        transaction.setReferenceNumber(request.getReferenceNumber());
        transaction.setChequeNumber(request.getChequeNumber());
        transaction.setBankName(request.getBankName());
        transaction.setChequeDate(request.getChequeDate());
        transaction.setUpiId(request.getUpiId());
        transaction.setUtrNumber(request.getUtrNumber());
        transaction.setCardType(request.getCardType());
        transaction.setCardLastFourDigits(request.getCardLastFourDigits());
        transaction.setPaymentMonth(request.getPaymentMonth());
        transaction.setLateFee(request.getLateFee());
        transaction.setDiscount(request.getDiscount());
        transaction.setTaxAmount(request.getTaxAmount());
        transaction.setReceiptNumber(request.getReceiptNumber());
        transaction.setInvoiceNumber(request.getInvoiceNumber());
        transaction.setRelatedBillId(request.getRelatedBillId());
        transaction.setRelatedBillType(request.getRelatedBillType());
        
        // Set flat if provided
        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit/Flat not found"));
            transaction.setFlat(flat);
        }

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    @Override
    public TransactionResponse getById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found"));
        if (transaction.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), transaction.getSociety().getId());
        }
        return mapToResponse(transaction);
    }

    @Override
    public List<TransactionResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return transactionRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getByType(String transactionType) {
        return transactionRepository.findByTransactionType(transactionType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getByPaymentMode(String paymentMode) {
        return transactionRepository.findByPaymentMode(paymentMode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getByDateRange(Long societyId, LocalDate start, LocalDate end) {
        return transactionRepository.findBySocietyIdAndTransactionDateBetween(societyId, start, end).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return transactionRepository.findAll().stream()
                .filter(t -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return t.getSociety() != null && currentUser.getSociety() != null
                            && t.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TransactionResponse update(Long id, TransactionRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found"));

        // Determine final values for validation
        String transactionType = request.getTransactionType() != null 
                ? request.getTransactionType() : transaction.getTransactionType();
        String category = request.getCategory() != null 
                ? request.getCategory() : transaction.getCategory();
        Long flatId = request.getFlatId() != null 
                ? request.getFlatId() : (transaction.getFlat() != null ? transaction.getFlat().getId() : null);

        // Validate: MAINTENANCE income requires flatId
        if ("INCOME".equalsIgnoreCase(transactionType) 
                && "MAINTENANCE".equalsIgnoreCase(category)) {
            if (flatId == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, 
                    "Unit/Flat is required for maintenance income transactions");
            }
        }

        if (request.getTransactionType() != null)
            transaction.setTransactionType(request.getTransactionType());
        if (request.getPaymentMode() != null)
            transaction.setPaymentMode(request.getPaymentMode());
        if (request.getAmount() != null)
            transaction.setAmount(request.getAmount());
        if (request.getCategory() != null)
            transaction.setCategory(request.getCategory());
        if (request.getDescription() != null)
            transaction.setDescription(request.getDescription());
        if (request.getTransactionDate() != null)
            transaction.setTransactionDate(request.getTransactionDate());
        if (request.getReferenceNumber() != null)
            transaction.setReferenceNumber(request.getReferenceNumber());
        if (request.getChequeNumber() != null)
            transaction.setChequeNumber(request.getChequeNumber());
        if (request.getBankName() != null)
            transaction.setBankName(request.getBankName());
        if (request.getChequeDate() != null)
            transaction.setChequeDate(request.getChequeDate());
        if (request.getUpiId() != null)
            transaction.setUpiId(request.getUpiId());
        if (request.getUtrNumber() != null)
            transaction.setUtrNumber(request.getUtrNumber());
        if (request.getCardType() != null)
            transaction.setCardType(request.getCardType());
        if (request.getCardLastFourDigits() != null)
            transaction.setCardLastFourDigits(request.getCardLastFourDigits());
        if (request.getPaymentMonth() != null)
            transaction.setPaymentMonth(request.getPaymentMonth());
        if (request.getLateFee() != null)
            transaction.setLateFee(request.getLateFee());
        if (request.getDiscount() != null)
            transaction.setDiscount(request.getDiscount());
        if (request.getTaxAmount() != null)
            transaction.setTaxAmount(request.getTaxAmount());
        if (request.getReceiptNumber() != null)
            transaction.setReceiptNumber(request.getReceiptNumber());
        if (request.getInvoiceNumber() != null)
            transaction.setInvoiceNumber(request.getInvoiceNumber());
        
        // Update flat if provided
        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit/Flat not found"));
            transaction.setFlat(flat);
        }

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        if (!transactionRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Transaction not found");
        }
        transactionRepository.deleteById(id);
    }

    @Override
    public BigDecimal getTotalIncome(Long societyId) {
        BigDecimal total = transactionRepository.sumBySocietyAndType(societyId, "INCOME");
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getTotalExpense(Long societyId) {
        BigDecimal total = transactionRepository.sumBySocietyAndType(societyId, "EXPENSE");
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public Map<String, BigDecimal> getSummaryByCategory(Long societyId, LocalDate start, LocalDate end) {
        List<Transaction> transactions = transactionRepository.findBySocietyIdAndTransactionDateBetween(societyId,
                start, end);

        Map<String, BigDecimal> summary = new HashMap<>();
        for (Transaction t : transactions) {
            String key = t.getTransactionType() + "_" + t.getCategory();
            summary.merge(key, t.getAmount(), BigDecimal::add);
        }
        return summary;
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setSocietyId(transaction.getSociety().getId());
        response.setSocietyName(transaction.getSociety().getName());
        response.setTransactionType(transaction.getTransactionType());
        response.setPaymentMode(transaction.getPaymentMode());
        response.setAmount(transaction.getAmount());
        response.setCategory(transaction.getCategory());
        response.setDescription(transaction.getDescription());
        response.setTransactionDate(transaction.getTransactionDate());
        response.setReferenceNumber(transaction.getReferenceNumber());
        response.setChequeNumber(transaction.getChequeNumber());
        response.setBankName(transaction.getBankName());
        response.setChequeDate(transaction.getChequeDate());
        response.setUpiId(transaction.getUpiId());
        response.setUtrNumber(transaction.getUtrNumber());
        response.setCardType(transaction.getCardType());
        response.setCardLastFourDigits(transaction.getCardLastFourDigits());
        response.setPaymentMonth(transaction.getPaymentMonth());
        response.setLateFee(transaction.getLateFee());
        response.setDiscount(transaction.getDiscount());
        response.setTaxAmount(transaction.getTaxAmount());
        response.setReceiptNumber(transaction.getReceiptNumber());
        response.setInvoiceNumber(transaction.getInvoiceNumber());
        response.setRelatedBillId(transaction.getRelatedBillId());
        response.setRelatedBillType(transaction.getRelatedBillType());
        if (transaction.getFlat() != null) {
            response.setFlatId(transaction.getFlat().getId());
            response.setFlatNumber(transaction.getFlat().getFlatNumber());
        }
        response.setCreatedBy(transaction.getCreatedBy());
        response.setCreatedAt(transaction.getCreatedAt());
        return response;
    }
}
