package com.society.backend.service.maintenance;

import com.society.backend.dto.maintenance.MaintenanceBillRequest;
import com.society.backend.dto.maintenance.MaintenanceBillResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.MaintenanceBill;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.maintenance.MaintenanceBillRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceBillServiceImpl implements MaintenanceBillService {

    private final MaintenanceBillRepository maintenanceBillRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public MaintenanceBillResponse create(MaintenanceBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        // Check if bill already exists for this flat and month
        if (maintenanceBillRepository.findByFlatIdAndBillMonth(request.getFlatId(), request.getBillMonth())
                .isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bill already exists for this flat and month");
        }

        MaintenanceBill bill = new MaintenanceBill();
        bill.setFlat(flat);
        bill.setBillMonth(request.getBillMonth());
        bill.setAmount(request.getAmount());
        bill.setPaidAmount(request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO);
        bill.setPaymentMode(request.getPaymentMode());
        bill.setReferenceNumber(request.getReferenceNumber());

        updateBillStatus(bill);

        MaintenanceBill saved = maintenanceBillRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    public MaintenanceBillResponse getById(Long id) {
        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));
        return mapToResponse(bill);
    }

    @Override
    public List<MaintenanceBillResponse> getByFlatId(Long flatId) {
        return maintenanceBillRepository.findByFlatId(flatId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MaintenanceBillResponse> getByBillMonth(String billMonth) {
        return maintenanceBillRepository.findByBillMonth(billMonth).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MaintenanceBillResponse> getByStatus(String status) {
        return maintenanceBillRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MaintenanceBillResponse> getPending() {
        return maintenanceBillRepository.findByStatus("PENDING").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MaintenanceBillResponse> getAll() {
        return maintenanceBillRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MaintenanceBillResponse update(Long id, MaintenanceBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

        if (request.getAmount() != null)
            bill.setAmount(request.getAmount());
        if (request.getBillMonth() != null)
            bill.setBillMonth(request.getBillMonth());

        updateBillStatus(bill);

        MaintenanceBill saved = maintenanceBillRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceBillResponse recordPayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId) {
        roleService.requireAdminOrCommittee(userId);

        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

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
            bill.setReceiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        MaintenanceBill saved = maintenanceBillRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        List<Flat> flats = flatRepository.findBySocietyId(societyId);

        for (Flat flat : flats) {
            // Skip if bill already exists
            if (maintenanceBillRepository.findByFlatIdAndBillMonth(flat.getId(), billMonth).isPresent()) {
                continue;
            }

            MaintenanceBill bill = new MaintenanceBill();
            bill.setFlat(flat);
            bill.setBillMonth(billMonth);
            bill.setAmount(amount);
            bill.setPaidAmount(BigDecimal.ZERO);
            bill.setStatus("PENDING");

            maintenanceBillRepository.save(bill);
        }
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        if (!maintenanceBillRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found");
        }
        maintenanceBillRepository.deleteById(id);
    }

    private void updateBillStatus(MaintenanceBill bill) {
        if (bill.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus("PENDING");
        } else if (bill.getPaidAmount().compareTo(bill.getAmount()) >= 0) {
            bill.setStatus("PAID");
        } else {
            bill.setStatus("PARTIAL");
        }
    }

    private MaintenanceBillResponse mapToResponse(MaintenanceBill bill) {
        MaintenanceBillResponse response = new MaintenanceBillResponse();
        response.setId(bill.getId());
        response.setFlatId(bill.getFlat().getId());
        response.setFlatNumber(bill.getFlat().getFlatNumber());
        response.setOwnerName(bill.getFlat().getOwnerName());
        response.setBillMonth(bill.getBillMonth());
        response.setAmount(bill.getAmount());
        response.setPaidAmount(bill.getPaidAmount());
        response.setPendingAmount(bill.getAmount().subtract(bill.getPaidAmount()));
        response.setStatus(bill.getStatus());
        response.setPaymentMode(bill.getPaymentMode());
        response.setReceiptNumber(bill.getReceiptNumber());
        response.setReferenceNumber(bill.getReferenceNumber());
        response.setCreatedAt(bill.getCreatedAt());
        response.setPaidAt(bill.getPaidAt());
        return response;
    }
}
