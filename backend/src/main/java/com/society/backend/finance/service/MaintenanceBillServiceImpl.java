package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.BillLineItemRequest;
import com.society.backend.finance.dto.request.MaintenanceBillRequest;
import com.society.backend.finance.dto.response.MaintenanceBillResponse;
import com.society.backend.finance.dto.response.BillLineItemResponse;
import com.society.backend.finance.dto.request.TransactionRequest;
import com.society.backend.finance.entity.BillLineItem;
import com.society.backend.flat.entity.Flat;
import com.society.backend.finance.entity.MaintenanceBill;
import com.society.backend.society.entity.SocietySetting;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.society.repository.SocietySettingRepository;
import com.society.backend.common.service.RoleService;
import com.society.backend.finance.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.society.backend.finance.entity.Payment;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.Role;
@Service
@RequiredArgsConstructor
public class MaintenanceBillServiceImpl implements MaintenanceBillService {

    private final MaintenanceBillRepository maintenanceBillRepository;
    private final FlatRepository flatRepository;
    private final SocietySettingRepository societySettingRepository;
    private final RoleService roleService;
    private final TransactionService transactionService;

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
        bill.setSociety(flat.getSociety());
        bill.setBillMonth(request.getBillMonth());
        bill.setDueDate(request.getDueDate());
        bill.setPaidAmount(request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO);
        bill.setPaymentMode(request.getPaymentMode());
        bill.setReferenceNumber(request.getReferenceNumber());

        if (request.getLineItems() != null && !request.getLineItems().isEmpty()) {
            applyManualLineItems(bill, request.getLineItems());
        } else {
            if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Amount is required when line items are not provided");
            }
            applyLegacyAmountMode(bill, request.getAmount());
        }

        if (bill.getDueDate() == null) {
            SocietySetting setting = getSocietySetting(flat.getSociety() != null ? flat.getSociety().getId() : null);
            bill.setDueDate(resolveDueDate(request.getBillMonth(), setting));
        }

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
    public List<MaintenanceBillResponse> getBySociety(Long societyId) {
        return maintenanceBillRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MaintenanceBillResponse update(Long id, MaintenanceBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

        if (request.getLineItems() != null && !request.getLineItems().isEmpty()) {
            applyManualLineItems(bill, request.getLineItems());
        } else if (request.getAmount() != null) {
            if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Amount must be positive");
            }
            applyLegacyAmountMode(bill, request.getAmount());
        }
        if (request.getBillMonth() != null)
            bill.setBillMonth(request.getBillMonth());
        if (request.getDueDate() != null)
            bill.setDueDate(request.getDueDate());

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

        BigDecimal payableAmount = getPayableAmount(bill);
        BigDecimal newPaidAmount = bill.getPaidAmount().add(amount);
        if (newPaidAmount.compareTo(payableAmount) > 0) {
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
        
        // Auto-create income transaction for this payment
        createIncomeTransaction(saved, amount, paymentMode, referenceNumber, userId);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceBillResponse recordOnlinePayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId) {
        // No role check - this is for verified online payments (Razorpay)
        // The payment has already been verified by PaymentService

        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

        BigDecimal payableAmount = getPayableAmount(bill);
        BigDecimal newPaidAmount = bill.getPaidAmount().add(amount);
        if (newPaidAmount.compareTo(payableAmount) > 0) {
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
        
        // Auto-create income transaction for this payment
        createIncomeTransaction(saved, amount, paymentMode, referenceNumber, userId);

        return mapToResponse(saved);
    }
    
    /**
     * Creates an income transaction linked to the maintenance bill payment
     */
    private void createIncomeTransaction(MaintenanceBill bill, BigDecimal amount, String paymentMode, String referenceNumber, Long userId) {
        Flat flat = bill.getFlat();
        if (flat == null || flat.getSociety() == null) {
            return; // Cannot create transaction without society context
        }
        
        TransactionRequest txRequest = new TransactionRequest();
        txRequest.setSocietyId(flat.getSociety().getId());
        txRequest.setTransactionType("INCOME");
        txRequest.setPaymentMode(paymentMode != null ? paymentMode : "CASH");
        txRequest.setAmount(amount);
        txRequest.setCategory("MAINTENANCE");
        txRequest.setDescription("Maintenance Payment: " + bill.getBillMonth() + " - Unit " + flat.getFlatNumber());
        txRequest.setTransactionDate(LocalDate.now());
        txRequest.setReferenceNumber(referenceNumber);
        txRequest.setRelatedBillId(bill.getId());
        txRequest.setRelatedBillType("MAINTENANCE_BILL");
        txRequest.setFlatId(flat.getId());
        
        // Use createFromSystem to bypass role checks - this is a system-generated transaction
        transactionService.createFromSystem(txRequest);
    }

    @Override
    @Transactional
    public void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, Long userId) {
        // Call the overloaded method with no property type filter
        generateBillsForSociety(societyId, billMonth, amount, null, userId);
    }
    
    @Override
    @Transactional
    public void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, String propertyType, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        SocietySetting setting = getSocietySetting(societyId);

        List<Flat> flats;
        if (propertyType != null && !propertyType.isEmpty() && !"ALL".equalsIgnoreCase(propertyType)) {
            flats = flatRepository.findBySocietyIdAndUnitType(societyId, propertyType);
        } else {
            flats = flatRepository.findBySocietyId(societyId);
        }

        for (Flat flat : flats) {
            // Skip if bill already exists
            if (maintenanceBillRepository.findByFlatIdAndBillMonth(flat.getId(), billMonth).isPresent()) {
                continue;
            }

            MaintenanceBill bill = new MaintenanceBill();
            bill.setFlat(flat);
            bill.setSociety(flat.getSociety());
            bill.setBillMonth(billMonth);
            bill.setDueDate(resolveDueDate(billMonth, setting));

            List<BillLineItem> generatedItems = buildDefaultLineItems(flat, setting);
            if (generatedItems.isEmpty()) {
                BigDecimal fallbackAmount = amount != null && amount.compareTo(BigDecimal.ZERO) > 0 ? amount : BigDecimal.ZERO;
                applyLegacyAmountMode(bill, fallbackAmount);
            } else {
                applyComputedLineItems(bill, generatedItems);
            }

            bill.setPaidAmount(BigDecimal.ZERO);
            bill.setStatus("PENDING");

            maintenanceBillRepository.save(bill);
        }
    }
    
    @Override
    public int getGenerationPreviewCount(Long societyId, String billMonth, String propertyType) {
        List<Flat> flats;
        if (propertyType != null && !propertyType.isEmpty() && !"ALL".equalsIgnoreCase(propertyType)) {
            flats = flatRepository.findBySocietyIdAndUnitType(societyId, propertyType);
        } else {
            flats = flatRepository.findBySocietyId(societyId);
        }
        
        // Count only flats that don't already have a bill for this month
        int count = 0;
        for (Flat flat : flats) {
            if (!maintenanceBillRepository.findByFlatIdAndBillMonth(flat.getId(), billMonth).isPresent()) {
                count++;
            }
        }
        return count;
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
        BigDecimal payableAmount = getPayableAmount(bill);
        if (bill.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus("PENDING");
        } else if (bill.getPaidAmount().compareTo(payableAmount) >= 0) {
            bill.setStatus("PAID");
        } else {
            bill.setStatus("PARTIAL");
        }
    }

    private BigDecimal getPayableAmount(MaintenanceBill bill) {
        if (bill.getTotalAmount() != null && bill.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            return bill.getTotalAmount();
        }
        return bill.getAmount() != null ? bill.getAmount() : BigDecimal.ZERO;
    }

    private void applyLegacyAmountMode(MaintenanceBill bill, BigDecimal amount) {
        bill.setAmount(amount);
        bill.setSubtotal(amount);
        bill.setTaxAmount(BigDecimal.ZERO);
        bill.setInterestAmount(BigDecimal.ZERO);
        bill.setPenaltyAmount(BigDecimal.ZERO);
        bill.setTotalAmount(amount);
        bill.setPreviousBalance(BigDecimal.ZERO);
        bill.setAdvanceBalance(BigDecimal.ZERO);
        bill.setLineItems(new ArrayList<>());
    }

    private void applyManualLineItems(MaintenanceBill bill, List<BillLineItemRequest> requestItems) {
        List<BillLineItem> items = new ArrayList<>();
        int index = 0;

        for (BillLineItemRequest requestItem : requestItems) {
            BigDecimal rate = nonNegative(requestItem.getRate() != null ? requestItem.getRate() : BigDecimal.ZERO);
            BigDecimal quantity = nonNegative(requestItem.getQuantity() != null ? requestItem.getQuantity() : BigDecimal.ONE);
            BigDecimal computedAmount = rate.multiply(quantity);
            BigDecimal amount = requestItem.getAmount() != null ? nonNegative(requestItem.getAmount()) : computedAmount;

            BillLineItem item = new BillLineItem();
            item.setChargeType(requestItem.getChargeType());
            item.setDescription(requestItem.getDescription());
            item.setRate(rate);
            item.setQuantity(quantity);
            item.setAmount(amount);
            item.setIsTaxable(requestItem.getIsTaxable() != null ? requestItem.getIsTaxable() : false);
            item.setDisplayOrder(requestItem.getDisplayOrder() != null ? requestItem.getDisplayOrder() : index++);
            items.add(item);
        }

        applyComputedLineItems(bill, items);
    }

    private void applyComputedLineItems(MaintenanceBill bill, List<BillLineItem> items) {
        BigDecimal subtotal = items.stream().map(BillLineItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        bill.setAmount(subtotal);
        bill.setSubtotal(subtotal);
        bill.setTaxAmount(BigDecimal.ZERO);
        bill.setInterestAmount(BigDecimal.ZERO);
        bill.setPenaltyAmount(BigDecimal.ZERO);
        bill.setTotalAmount(subtotal);
        bill.setPreviousBalance(BigDecimal.ZERO);
        bill.setAdvanceBalance(BigDecimal.ZERO);

        for (BillLineItem item : items) {
            item.setMaintenanceBill(bill);
        }
        bill.setLineItems(items);
    }

    private List<BillLineItem> buildDefaultLineItems(Flat flat, SocietySetting setting) {
        if (setting == null) {
            return Collections.emptyList();
        }

        List<BillLineItem> items = new ArrayList<>();
        BigDecimal area = flat.getArea() != null ? flat.getArea() : BigDecimal.ZERO;

        addItem(items, "MAINTENANCE", "Maintenance charge", setting.getMaintenanceRatePerSqft(), area, true);
        addItem(items, "SINKING_FUND", "Sinking fund", setting.getSinkingFundPerSqft(), area, false);
        addItem(items, "REPAIR_FUND", "Repair fund", setting.getRepairFundPerSqft(), area, false);
        addItem(items, "WATER_CHARGES", "Water charges", setting.getWaterChargesFixed(), BigDecimal.ONE, true);
        addItem(items, "LIFT_MAINTENANCE", "Lift maintenance", setting.getLiftMaintenanceCharge(), BigDecimal.ONE, true);
        addItem(items, "ELECTRICITY_COMMON", "Common electricity", setting.getElectricityCommonCharge(), BigDecimal.ONE, true);
        addItem(items, "SECURITY_CHARGE", "Security charge", setting.getSecurityCharge(), BigDecimal.ONE, true);
        addItem(items, "INSURANCE", "Insurance", setting.getInsuranceCharge(), BigDecimal.ONE, false);
        addItem(items, "CLUB_HOUSE", "Club house", setting.getClubHouseCharge(), BigDecimal.ONE, true);
        addItem(items, "PROPERTY_TAX", "Property tax share", setting.getPropertyTaxShare(), BigDecimal.ONE, false);

        BigDecimal taxableBase = items.stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsTaxable()))
                .map(BillLineItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (setting.getGstPercentage() != null && setting.getGstPercentage().compareTo(BigDecimal.ZERO) > 0
                && taxableBase.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal gstAmount = taxableBase.multiply(setting.getGstPercentage()).divide(BigDecimal.valueOf(100));
            addItem(items, "GST", "GST", gstAmount, BigDecimal.ONE, false);
            BillLineItem gstLine = items.get(items.size() - 1);
            gstLine.setRate(setting.getGstPercentage());
            gstLine.setDescription("GST @ " + setting.getGstPercentage() + "%");
        }

        return items;
    }

    private void addItem(List<BillLineItem> items, String chargeType, String description, BigDecimal rate, BigDecimal quantity,
            boolean taxable) {
        if (rate == null || quantity == null || rate.compareTo(BigDecimal.ZERO) <= 0 || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BillLineItem item = new BillLineItem();
        item.setChargeType(chargeType);
        item.setDescription(description);
        item.setRate(rate);
        item.setQuantity(quantity);
        item.setAmount(rate.multiply(quantity));
        item.setIsTaxable(taxable);
        item.setDisplayOrder(items.size());
        items.add(item);
    }

    private SocietySetting getSocietySetting(Long societyId) {
        if (societyId == null) {
            return null;
        }
        return societySettingRepository.findBySocietyId(societyId).orElse(null);
    }

    private LocalDate resolveDueDate(String billMonth, SocietySetting setting) {
        if (billMonth == null || billMonth.isBlank()) {
            return null;
        }
        try {
            YearMonth yearMonth = YearMonth.parse(billMonth);
            int configuredDay = setting != null && setting.getDueDateDay() != null ? setting.getDueDateDay() : 10;
            int day = Math.max(1, Math.min(configuredDay, yearMonth.lengthOfMonth()));
            return yearMonth.atDay(day);
        } catch (Exception ignored) {
            return null;
        }
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Line item values cannot be negative");
        }
        return value;
    }

    private MaintenanceBillResponse mapToResponse(MaintenanceBill bill) {
        MaintenanceBillResponse response = new MaintenanceBillResponse();
        response.setId(bill.getId());
        response.setFlatId(bill.getFlat().getId());
        response.setFlatNumber(bill.getFlat().getFlatNumber());
        response.setOwnerName(bill.getFlat().getOwnerName());
        response.setSocietyId(bill.getFlat().getSociety().getId());
        response.setSocietyName(bill.getFlat().getSociety().getName());
        response.setBillMonth(bill.getBillMonth());
        response.setBillNumber(bill.getBillNumber());
        response.setAmount(bill.getAmount());
        response.setSubtotal(bill.getSubtotal());
        response.setTaxAmount(bill.getTaxAmount());
        response.setInterestAmount(bill.getInterestAmount());
        response.setPenaltyAmount(bill.getPenaltyAmount());
        response.setTotalAmount(bill.getTotalAmount());
        response.setPreviousBalance(bill.getPreviousBalance());
        response.setAdvanceBalance(bill.getAdvanceBalance());
        response.setPaidAmount(bill.getPaidAmount());
        response.setPendingAmount(getPayableAmount(bill).subtract(bill.getPaidAmount()));
        response.setDueDate(bill.getDueDate());
        response.setPaymentDate(bill.getPaymentDate());
        response.setStatus(bill.getStatus());
        response.setPaymentMode(bill.getPaymentMode());
        response.setReceiptNumber(bill.getReceiptNumber());
        response.setReferenceNumber(bill.getReferenceNumber());
        response.setCreatedAt(bill.getCreatedAt());
        response.setPaidAt(bill.getPaidAt());
        response.setLineItems(
                bill.getLineItems() == null
                        ? Collections.emptyList()
                        : bill.getLineItems().stream().map(this::mapLineItemToResponse).collect(Collectors.toList()));
        return response;
    }

    private BillLineItemResponse mapLineItemToResponse(com.society.backend.finance.entity.BillLineItem lineItem) {
        BillLineItemResponse response = new BillLineItemResponse();
        response.setId(lineItem.getId());
        response.setChargeType(lineItem.getChargeType());
        response.setDescription(lineItem.getDescription());
        response.setRate(lineItem.getRate());
        response.setQuantity(lineItem.getQuantity());
        response.setAmount(lineItem.getAmount());
        response.setIsTaxable(lineItem.getIsTaxable());
        response.setDisplayOrder(lineItem.getDisplayOrder());
        return response;
    }
}
