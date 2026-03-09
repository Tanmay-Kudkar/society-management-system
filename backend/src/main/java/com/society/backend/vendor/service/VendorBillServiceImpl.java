package com.society.backend.vendor.service;

import com.society.backend.finance.dto.request.TransactionRequest;
import com.society.backend.vendor.dto.request.VendorBillRequest;
import com.society.backend.vendor.dto.response.VendorBillResponse;
import com.society.backend.society.entity.Society;
import com.society.backend.vendor.entity.Vendor;
import com.society.backend.vendor.entity.VendorBill;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.vendor.repository.VendorBillRepository;
import com.society.backend.vendor.repository.VendorRepository;
import com.society.backend.common.service.RoleService;
import com.society.backend.finance.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.finance.entity.Payment;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
public class VendorBillServiceImpl implements VendorBillService {

    private final VendorBillRepository vendorBillRepository;
    private final VendorRepository vendorRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;
    private final TransactionService transactionService;

    @Override
    @Transactional
    public VendorBillResponse create(VendorBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());

        VendorBill bill = new VendorBill();
        bill.setVendor(vendor);
        bill.setSociety(society);
        bill.setBillNumber(request.getBillNumber());
        bill.setAmount(request.getAmount());
        bill.setPaidAmount(request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO);
        bill.setBillDate(request.getBillDate() != null ? request.getBillDate() : LocalDate.now());
        bill.setDueDate(request.getDueDate());
        bill.setDescription(request.getDescription());
        bill.setPaymentMode(request.getPaymentMode());
        bill.setReferenceNumber(request.getReferenceNumber());

        updateBillStatus(bill);

        VendorBill saved = vendorBillRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    public VendorBillResponse getById(Long id) {
        VendorBill bill = vendorBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor bill not found"));
        if (bill.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), bill.getSociety().getId());
        }
        return mapToResponse(bill);
    }

    @Override
    public List<VendorBillResponse> getByVendorId(Long vendorId) {
        var currentUser = roleService.getCurrentUser();
        return vendorBillRepository.findByVendorId(vendorId).stream()
                .filter(b -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return b.getSociety() != null && currentUser.getSociety() != null
                            && b.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorBillResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return vendorBillRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorBillResponse> getByStatus(String status) {
        var currentUser = roleService.getCurrentUser();
        return vendorBillRepository.findByStatus(status).stream()
                .filter(b -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return b.getSociety() != null && currentUser.getSociety() != null
                            && b.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorBillResponse> getPending(Long societyId) {
        return vendorBillRepository.findBySocietyIdAndStatus(societyId, "PENDING").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorBillResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return vendorBillRepository.findAll().stream()
                .filter(b -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return b.getSociety() != null && currentUser.getSociety() != null
                            && b.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VendorBillResponse update(Long id, VendorBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        VendorBill bill = vendorBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor bill not found"));

        if (bill.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), bill.getSociety().getId());
        }

        if (request.getBillNumber() != null)
            bill.setBillNumber(request.getBillNumber());
        if (request.getAmount() != null)
            bill.setAmount(request.getAmount());
        if (request.getBillDate() != null)
            bill.setBillDate(request.getBillDate());
        if (request.getDueDate() != null)
            bill.setDueDate(request.getDueDate());
        if (request.getDescription() != null)
            bill.setDescription(request.getDescription());

        updateBillStatus(bill);

        VendorBill saved = vendorBillRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public VendorBillResponse recordPayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId) {
        roleService.requireAdminOrCommittee(userId);

        VendorBill bill = vendorBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor bill not found"));

        BigDecimal newPaidAmount = bill.getPaidAmount().add(amount);
        if (newPaidAmount.compareTo(bill.getAmount()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment amount exceeds bill amount");
        }

        bill.setPaidAmount(newPaidAmount);
        bill.setPaymentMode(paymentMode);
        bill.setReferenceNumber(referenceNumber);

        updateBillStatus(bill);

        if ("PAID".equals(bill.getStatus())) {
            bill.setPaidAt(LocalDateTime.now());
        }

        VendorBill saved = vendorBillRepository.save(bill);
        
        // Auto-create expense transaction for this payment
        createExpenseTransaction(saved, amount, paymentMode, referenceNumber, userId);

        return mapToResponse(saved);
    }
    
    /**
     * Creates an expense transaction linked to the vendor bill payment
     */
    private void createExpenseTransaction(VendorBill bill, BigDecimal amount, String paymentMode, String referenceNumber, Long userId) {
        TransactionRequest txRequest = new TransactionRequest();
        txRequest.setSocietyId(bill.getSociety().getId());
        txRequest.setTransactionType("EXPENSE");
        txRequest.setPaymentMode(paymentMode != null ? paymentMode : "CASH");
        txRequest.setAmount(amount);
        txRequest.setCategory("VENDOR_PAYMENT");
        txRequest.setDescription("Vendor Bill Payment: " + bill.getBillNumber() + " - " + bill.getVendor().getName());
        txRequest.setTransactionDate(LocalDate.now());
        txRequest.setReferenceNumber(referenceNumber);
        txRequest.setRelatedBillId(bill.getId());
        txRequest.setRelatedBillType("VENDOR_BILL");
        
        transactionService.create(txRequest, userId);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        if (!vendorBillRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Vendor bill not found");
        }
        vendorBillRepository.deleteById(id);
    }

    private void updateBillStatus(VendorBill bill) {
        if (bill.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus("PENDING");
        } else if (bill.getPaidAmount().compareTo(bill.getAmount()) >= 0) {
            bill.setStatus("PAID");
        } else {
            bill.setStatus("PARTIAL");
        }
    }

    private VendorBillResponse mapToResponse(VendorBill bill) {
        VendorBillResponse response = new VendorBillResponse();
        response.setId(bill.getId());
        response.setVendorId(bill.getVendor().getId());
        response.setVendorName(bill.getVendor().getName());
        response.setSocietyId(bill.getSociety().getId());
        response.setSocietyName(bill.getSociety().getName());
        response.setBillNumber(bill.getBillNumber());
        response.setAmount(bill.getAmount());
        response.setPaidAmount(bill.getPaidAmount());
        response.setPendingAmount(bill.getAmount().subtract(bill.getPaidAmount()));
        response.setStatus(bill.getStatus());
        response.setBillDate(bill.getBillDate());
        response.setDueDate(bill.getDueDate());
        Long pendingDays = bill.getPendingDays();
        response.setPendingDays(pendingDays != null ? pendingDays.intValue() : null);
        response.setDescription(bill.getDescription());
        response.setPaymentMode(bill.getPaymentMode());
        response.setReferenceNumber(bill.getReferenceNumber());
        response.setCreatedAt(bill.getCreatedAt());
        response.setPaidAt(bill.getPaidAt());
        return response;
    }
}
