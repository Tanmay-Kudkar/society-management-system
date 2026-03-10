package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.BillLineItemRequest;
import com.society.backend.finance.dto.request.MaintenanceBillRequest;
import com.society.backend.finance.dto.response.MaintenanceBillResponse;
import com.society.backend.finance.dto.response.BillLineItemResponse;
import com.society.backend.finance.dto.request.TransactionRequest;
import com.society.backend.finance.entity.BillLineItem;
import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Tenant;
import com.society.backend.finance.entity.MaintenanceBill;
import com.society.backend.society.entity.SocietySetting;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.flat.repository.TenantRepository;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.security.entity.Vehicle;
import com.society.backend.security.repository.VehicleRepository;
import com.society.backend.society.repository.SocietySettingRepository;
import com.society.backend.common.service.RoleService;
import com.society.backend.finance.service.TransactionService;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

import com.society.backend.finance.entity.Payment;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.Role;
@Service
@RequiredArgsConstructor
public class MaintenanceBillServiceImpl implements MaintenanceBillService {

    private final MaintenanceBillRepository maintenanceBillRepository;
    private final FlatRepository flatRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final SocietySettingRepository societySettingRepository;
    private final VehicleRepository vehicleRepository;
    private final RoleService roleService;
    private final TransactionService transactionService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public MaintenanceBillResponse create(MaintenanceBillRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        // Validate billing data
        if (request.getFlatId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing data");
        }
        if (request.getBillMonth() == null || request.getBillMonth().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing data");
        }

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        // Ensure the unit is assigned to a society
        if (flat.getSociety() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unit not assigned");
        }

        // Check if bill already exists for this flat and month
        if (maintenanceBillRepository.findByFlatIdAndBillMonth(request.getFlatId(), request.getBillMonth())
                .isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Bill already exists for this billing period");
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
            // Skip flats not assigned to a society
            if (flat.getSociety() == null) {
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

            BigDecimal carryForwardPending = resolveCarryForwardPending(flat.getId(), billMonth);
            if (carryForwardPending.compareTo(BigDecimal.ZERO) > 0) {
                bill.setPreviousBalance(carryForwardPending);
                BigDecimal currentTotal = bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO;
                bill.setTotalAmount(currentTotal.add(carryForwardPending));

                List<BillLineItem> lineItems = bill.getLineItems() != null ? bill.getLineItems() : new ArrayList<>();
                BillLineItem carryForwardLine = new BillLineItem();
                carryForwardLine.setMaintenanceBill(bill);
                carryForwardLine.setChargeType("PREVIOUS_BALANCE");
                carryForwardLine.setDescription("Previous pending amount (carry forward)");
                carryForwardLine.setRate(carryForwardPending);
                carryForwardLine.setQuantity(BigDecimal.ONE);
                carryForwardLine.setAmount(carryForwardPending);
                carryForwardLine.setIsTaxable(false);
                carryForwardLine.setDisplayOrder(lineItems.size());
                lineItems.add(carryForwardLine);
                bill.setLineItems(lineItems);
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
        roleService.requireAdminOrCommittee(userId);

        MaintenanceBill bill = maintenanceBillRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

        User requester = roleService.getUser(userId);
        if (requester.getRole() != Role.MASTER_ADMIN) {
            Long billSocietyId = bill.getSociety() != null ? bill.getSociety().getId() : null;
            roleService.enforceSocietyScope(requester, billSocietyId);
        }

        maintenanceBillRepository.delete(bill);
    }

    @Override
    public byte[] downloadInvoicePdf(Long billId, Long userId) {
        User requester = roleService.getUser(userId);
        MaintenanceBill bill = maintenanceBillRepository.findById(billId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Maintenance bill not found"));

        enforceInvoiceDownloadAccess(requester, bill);

        Society society = bill.getSociety() != null ? bill.getSociety() : (bill.getFlat() != null ? bill.getFlat().getSociety() : null);
        SocietySetting setting = society != null ? getSocietySetting(society.getId()) : null;

        BigDecimal baseAmount = (bill.getTotalAmount() != null && bill.getTotalAmount().compareTo(BigDecimal.ZERO) > 0)
                ? bill.getTotalAmount()
                : (bill.getAmount() != null ? bill.getAmount() : BigDecimal.ZERO);
        ChargesBreakdown overdueCharges = calculateOverdueCharges(bill, baseAmount);
        BigDecimal payableAmount = baseAmount.add(overdueCharges.interest).add(overdueCharges.penalty);

        return buildInvoicePdf(bill, setting, baseAmount, overdueCharges, payableAmount);
    }

    private void enforceInvoiceDownloadAccess(User requester, MaintenanceBill bill) {
        if (requester == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized access");
        }
        if (requester.getRole() == Role.MASTER_ADMIN) {
            return;
        }

        Long billSocietyId = bill.getSociety() != null ? bill.getSociety().getId() : null;
        if (requester.getRole() == Role.SOCIETY_ADMIN
                || requester.getRole() == Role.CHAIRMAN
                || requester.getRole() == Role.SECRETARY
                || requester.getRole() == Role.TREASURER
                || requester.getRole() == Role.COMMITTEE
                || requester.getRole() == Role.MANAGER
                || requester.getRole() == Role.EMPLOYEE) {
            roleService.enforceSocietyScope(requester, billSocietyId);
            return;
        }

        Long requesterFlatId = requester.getFlat() != null ? requester.getFlat().getId() : null;
        Long billFlatId = bill.getFlat() != null ? bill.getFlat().getId() : null;
        if ((requester.getRole() == Role.MEMBER || requester.getRole() == Role.TENANT)
                && requesterFlatId != null
                && requesterFlatId.equals(billFlatId)) {
            return;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to download this bill invoice");
    }

    private byte[] buildInvoicePdf(
            MaintenanceBill bill,
            SocietySetting setting,
            BigDecimal baseAmount,
            ChargesBreakdown overdueCharges,
            BigDecimal payableAmount) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 30, 30, 26, 26);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font bodyBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            InvoiceBreakdown breakdown = calculateInvoiceBreakdown(bill, setting, baseAmount, overdueCharges, payableAmount);

            Society society = bill.getSociety() != null ? bill.getSociety() : (bill.getFlat() != null ? bill.getFlat().getSociety() : null);

            Paragraph societyName = new Paragraph(society != null ? safe(society.getName()) : "Society", titleFont);
            societyName.setAlignment(Element.ALIGN_CENTER);
            societyName.setSpacingAfter(4);
            document.add(societyName);

            String headerLine = buildHeaderLine(society);
            if (!headerLine.isBlank()) {
                Paragraph headerMeta = new Paragraph(headerLine, subtitleFont);
                headerMeta.setAlignment(Element.ALIGN_CENTER);
                headerMeta.setLeading(13f);
                document.add(headerMeta);
            }

                Paragraph invoiceTitle = new Paragraph(
                    "Maintenance Bill of " + formatBillMonthLabel(bill.getBillMonth()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15));
            invoiceTitle.setAlignment(Element.ALIGN_CENTER);
            invoiceTitle.setSpacingBefore(6);
            invoiceTitle.setSpacingAfter(14);
            document.add(invoiceTitle);

            PdfPTable metaTable = new PdfPTable(new float[] { 1f, 1f });
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12);
            metaTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPTable clientInfoTable = new PdfPTable(new float[] { 1.1f, 2.4f });
            clientInfoTable.setWidthPercentage(100);
            clientInfoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            addInfoRow(clientInfoTable, "Client Name", resolveClientName(bill.getFlat()), bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Unit", bill.getFlat() != null ? bill.getFlat().getFlatNumber() : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Unit Type", bill.getFlat() != null ? bill.getFlat().getUnitType() : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Flat Type", bill.getFlat() != null ? bill.getFlat().getFlatType() : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Wing", (bill.getFlat() != null && bill.getFlat().getWing() != null) ? bill.getFlat().getWing().getName() : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Floor", (bill.getFlat() != null && bill.getFlat().getFloor() != null) ? String.valueOf(bill.getFlat().getFloor()) : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Area (SqFt)", formatAreaSqft(bill.getFlat()), bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "Address", society != null ? society.getAddress() : null, bodyBold, bodyFont, Element.ALIGN_LEFT);
            addInfoRow(clientInfoTable, "State/City", safe(society != null ? society.getState() : null) + " / " + safe(society != null ? society.getCity() : null), bodyBold, bodyFont, Element.ALIGN_LEFT);

            PdfPTable invoiceInfoTable = new PdfPTable(new float[] { 1.2f, 1.8f });
            invoiceInfoTable.setWidthPercentage(100);
            invoiceInfoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            addInfoRow(invoiceInfoTable, "Invoice No", resolveInvoiceNumber(bill, setting), bodyBold, bodyFont, Element.ALIGN_RIGHT);
            addInfoRow(invoiceInfoTable, "Bill Month", formatBillMonthLabel(bill.getBillMonth()), bodyBold, bodyFont, Element.ALIGN_RIGHT);
            addInfoRow(invoiceInfoTable, "Invoice Date", String.valueOf(LocalDate.now()), bodyBold, bodyFont, Element.ALIGN_RIGHT);
            addInfoRow(invoiceInfoTable, "Due Date", bill.getDueDate() != null ? String.valueOf(bill.getDueDate()) : "-", bodyBold, bodyFont, Element.ALIGN_RIGHT);
            addInfoRow(invoiceInfoTable, "Status", safe(bill.getStatus()), bodyBold, bodyFont, Element.ALIGN_RIGHT);

            PdfPCell leftCell = new PdfPCell(clientInfoTable);
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setPadding(6);
            PdfPCell rightCell = new PdfPCell(invoiceInfoTable);
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setPadding(6);
            metaTable.addCell(leftCell);
            metaTable.addCell(rightCell);
            document.add(metaTable);

            PdfPTable lineTable = new PdfPTable(new float[] { 0.8f, 3.8f, 1.6f });
            lineTable.setWidthPercentage(100);
            lineTable.setSpacingBefore(2);
            addHeaderCell(lineTable, "Sl No", bodyBold);
            addHeaderCell(lineTable, "Product", bodyBold);
            addHeaderCell(lineTable, "Amount (Rs)", bodyBold);

            int serial = 1;
            List<InvoiceDisplayLineItem> displayItems = buildInvoiceDisplayItems(bill);
            if (!displayItems.isEmpty()) {
                for (InvoiceDisplayLineItem item : displayItems) {
                    addBodyCell(lineTable, String.valueOf(serial++), bodyFont, Element.ALIGN_CENTER);
                    addBodyCell(lineTable, safe(item.description), bodyFont, Element.ALIGN_LEFT);
                    addBodyCell(lineTable, formatMoney(item.amount), bodyFont, Element.ALIGN_RIGHT);
                }
            } else {
                addBodyCell(lineTable, "1", bodyFont, Element.ALIGN_CENTER);
                addBodyCell(lineTable, "Maintenance charges", bodyFont, Element.ALIGN_LEFT);
                addBodyCell(lineTable, formatMoney(baseAmount), bodyFont, Element.ALIGN_RIGHT);
            }

            if (overdueCharges.interest.compareTo(BigDecimal.ZERO) > 0) {
                addBodyCell(lineTable, String.valueOf(serial++), bodyFont, Element.ALIGN_CENTER);
                addBodyCell(lineTable, "Late payment interest", bodyFont, Element.ALIGN_LEFT);
                addBodyCell(lineTable, formatMoney(overdueCharges.interest), bodyFont, Element.ALIGN_RIGHT);
            }
            if (overdueCharges.penalty.compareTo(BigDecimal.ZERO) > 0) {
                addBodyCell(lineTable, String.valueOf(serial), bodyFont, Element.ALIGN_CENTER);
                addBodyCell(lineTable, "Penalty", bodyFont, Element.ALIGN_LEFT);
                addBodyCell(lineTable, formatMoney(overdueCharges.penalty), bodyFont, Element.ALIGN_RIGHT);
            }

            PdfPCell taxableLabel = new PdfPCell(new Phrase("Grand Taxable Amount", bodyBold));
            taxableLabel.setColspan(2);
            taxableLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            taxableLabel.setPaddingTop(8);
            taxableLabel.setPaddingBottom(8);
            taxableLabel.setPaddingRight(8);
            lineTable.addCell(taxableLabel);

            PdfPCell taxableValue = new PdfPCell(new Phrase(formatMoney(breakdown.taxableBase), bodyBold));
            taxableValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            taxableValue.setPaddingTop(8);
            taxableValue.setPaddingBottom(8);
            taxableValue.setPaddingRight(8);
            lineTable.addCell(taxableValue);

            document.add(lineTable);

                    document.add(new Paragraph(" "));
                document.add(new Paragraph("Accounts Breakdown", sectionFont));

                PdfPTable accountsTable = new PdfPTable(new float[] { 2.8f, 1.2f });
                    accountsTable.setWidthPercentage(78);
                    accountsTable.setSpacingBefore(6);
                    accountsTable.setSpacingAfter(8);
                    addAccountRow(accountsTable, "Taxable Base", formatMoney(breakdown.taxableBase), bodyFont, false);
                    addAccountRow(accountsTable, "GST/Tax @ " + formatPercent(setting != null ? setting.getGstPercentage() : BigDecimal.ZERO), formatMoney(breakdown.gstTaxAmount), bodyFont, false);
                    addAccountRow(accountsTable, "Current Bill Subtotal", formatMoney(breakdown.currentBillSubtotal), bodyBold, false);
                    addAccountRow(accountsTable, "Simple Interest (Current Bill) @ " + formatPercent(setting != null ? setting.getLatePaymentInterestPct() : BigDecimal.ZERO), formatMoney(overdueCharges.interest), bodyFont, false);
                    addAccountRow(accountsTable, "Penalty (Current Bill)", formatMoney(overdueCharges.penalty), bodyFont, false);
                    addAccountRow(accountsTable, "Penalty Config (Society)", formatMoney(setting != null ? setting.getPenaltyFixed() : BigDecimal.ZERO), bodyFont, false);
                    addAccountRow(accountsTable, "Grace Period (Days)", String.valueOf(setting != null && setting.getGracePeriodDays() != null ? setting.getGracePeriodDays() : 0), bodyFont, false);
                    addAccountRow(accountsTable, "Non-Occupancy Surcharge @ " + formatPercent(setting != null ? setting.getNonOccupancySurchargePct() : BigDecimal.ZERO), "Configured", bodyFont, false);
                    addAccountRow(accountsTable, "Previous Pending Charges", formatMoney(breakdown.previousPendingCharges), bodyBold, false);
                    addAccountRow(accountsTable, "Previous Pending Interest", formatMoney(breakdown.previousPendingInterest), bodyFont, false);
                    addAccountRow(accountsTable, "Advance Balance", formatMoney(bill.getAdvanceBalance()), bodyFont, false);
                    addAccountRow(accountsTable, "Total Outstanding", formatMoney(breakdown.totalOutstanding), bodyBold, true);
                document.add(accountsTable);

                PdfPTable totalsTable = new PdfPTable(new float[] { 4f, 1.4f });
            totalsTable.setWidthPercentage(42);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    totalsTable.setSpacingBefore(10);
                BigDecimal paidAmount = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal balanceDue = breakdown.totalOutstanding.subtract(paidAmount);
                if (balanceDue.compareTo(BigDecimal.ZERO) < 0) {
                    balanceDue = BigDecimal.ZERO;
                }
                addTotalsRow(totalsTable, "Sub Total", formatMoney(breakdown.currentBillSubtotal), bodyBold, false);
            addTotalsRow(totalsTable, "Paid", formatMoney(paidAmount), bodyFont, false);
                addTotalsRow(totalsTable, "Balance Due", formatMoney(balanceDue), bodyBold, true);
            document.add(totalsTable);

            document.add(new Paragraph(" "));
            Paragraph paymentTitle = new Paragraph("Payment Details", sectionFont);
            paymentTitle.setSpacingBefore(4);
            paymentTitle.setSpacingAfter(4);
            document.add(paymentTitle);

            String paymentLink = resolvePaymentLink(setting, bill.getId());
            byte[] qrBytes = (!paymentLink.isBlank()) ? generateQrCode(paymentLink) : null;

            PdfPTable paymentSection = new PdfPTable(new float[] { 2.6f, 1.4f });
            paymentSection.setWidthPercentage(100);
            paymentSection.setKeepTogether(true);

            PdfPTable paymentTable = new PdfPTable(new float[] { 1.1f, 2.5f });
            paymentTable.setWidthPercentage(100);
            addPaymentRow(paymentTable, "Bank Name", setting != null ? setting.getBankName() : null, bodyFont);
            addPaymentRow(paymentTable, "Account Holder", setting != null ? setting.getAccountHolderName() : null, bodyFont);
            addPaymentRow(paymentTable, "Account Number", setting != null ? setting.getAccountNumber() : null, bodyFont);
            addPaymentRow(paymentTable, "IFSC", setting != null ? setting.getIfscCode() : null, bodyFont);
            addPaymentRow(paymentTable, "UPI ID", setting != null ? setting.getUpiId() : null, bodyFont);
            addPaymentRow(paymentTable, "Modes", "UPI, NetBanking, Card, NEFT/IMPS", bodyFont);

            PdfPCell paymentLeft = new PdfPCell(paymentTable);
            paymentLeft.setBorder(Rectangle.BOX);
            paymentLeft.setBorderColor(new java.awt.Color(110, 110, 110));
            paymentLeft.setPadding(0);
            paymentSection.addCell(paymentLeft);

            PdfPTable qrPanel = new PdfPTable(1);
            qrPanel.setWidthPercentage(100);

            PdfPCell qrTitleCell = new PdfPCell(new Phrase("Quick Pay", bodyBold));
            qrTitleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            qrTitleCell.setBackgroundColor(new java.awt.Color(245, 245, 245));
            qrTitleCell.setPaddingTop(6);
            qrTitleCell.setPaddingBottom(6);
            qrPanel.addCell(qrTitleCell);

            PdfPCell linkCell = new PdfPCell(new Phrase("Pay link:\n" + safe(paymentLink), bodyFont));
            linkCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            linkCell.setPadding(6);
            qrPanel.addCell(linkCell);

            if (qrBytes != null) {
                Image qrImage = Image.getInstance(qrBytes);
                qrImage.scaleToFit(110, 110);
                qrImage.setAlignment(Element.ALIGN_CENTER);
                PdfPCell qrCell = new PdfPCell(qrImage, false);
                qrCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                qrCell.setPaddingTop(6);
                qrCell.setPaddingBottom(4);
                qrPanel.addCell(qrCell);

                PdfPCell noteCell = new PdfPCell(new Phrase("Scan QR to pay", subtitleFont));
                noteCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                noteCell.setPaddingTop(0);
                noteCell.setPaddingBottom(6);
                qrPanel.addCell(noteCell);
            }

            PdfPCell paymentRight = new PdfPCell(qrPanel);
            paymentRight.setBorder(Rectangle.BOX);
            paymentRight.setBorderColor(new java.awt.Color(110, 110, 110));
            paymentRight.setPadding(0);
            paymentSection.addCell(paymentRight);
            document.add(paymentSection);

            document.add(new Paragraph(" "));
            Paragraph termsTitle = new Paragraph("Terms & Conditions", sectionFont);
            termsTitle.setSpacingBefore(4);
            termsTitle.setSpacingAfter(4);
            document.add(termsTitle);

            PdfPTable termsBox = new PdfPTable(1);
            termsBox.setWidthPercentage(100);
            termsBox.setKeepTogether(true);
            PdfPCell termsCell = new PdfPCell(new Phrase(
                    "1) Please pay before due date to avoid late interest and penalties.\n"
                    + "2) Keep receipt/reference number for reconciliation.",
                    bodyFont));
            termsCell.setPadding(8);
            termsCell.setBorder(Rectangle.BOX);
            termsCell.setBorderColor(new java.awt.Color(110, 110, 110));
            termsBox.addCell(termsCell);
            document.add(termsBox);

            document.add(new Paragraph(" "));
            Paragraph signaturesTitle = new Paragraph("Authorized Signatories", sectionFont);
            signaturesTitle.setSpacingBefore(4);
            signaturesTitle.setSpacingAfter(4);
            document.add(signaturesTitle);

            Long societyId = society != null ? society.getId() : null;
            LocalDate referenceDate = LocalDate.now();

            PdfPTable signaturesTable = new PdfPTable(new float[] { 1f, 1f, 1f });
            signaturesTable.setWidthPercentage(100);
            signaturesTable.setSpacingBefore(4);
            signaturesTable.setKeepTogether(true);
            addSignatureCell(signaturesTable, "Secretary", resolveCommitteeRoleName(societyId, Role.SECRETARY, setting, referenceDate), bodyFont, bodyBold);
            addSignatureCell(signaturesTable, "Treasurer", resolveCommitteeRoleName(societyId, Role.TREASURER, setting, referenceDate), bodyFont, bodyBold);
            addSignatureCell(signaturesTable, "Chairman", resolveCommitteeRoleName(societyId, Role.CHAIRMAN, setting, referenceDate), bodyFont, bodyBold);
            document.add(signaturesTable);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to generate invoice PDF: " + ex.getMessage());
        }
    }

    private void addHeaderCell(PdfPTable table, String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPaddingTop(8);
        cell.setPaddingBottom(8);
        cell.setBackgroundColor(new java.awt.Color(245, 245, 245));
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String value, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(safe(value), font));
        cell.setHorizontalAlignment(align);
        cell.setPaddingTop(7);
        cell.setPaddingBottom(7);
        cell.setPaddingLeft(6);
        cell.setPaddingRight(6);
        table.addCell(cell);
    }

    private void addInfoRow(PdfPTable table, String key, String value, Font keyFont, Font valueFont, int align) {
        PdfPCell keyCell = new PdfPCell(new Phrase(key + ":", keyFont));
        keyCell.setBorder(Rectangle.NO_BORDER);
        keyCell.setHorizontalAlignment(align);
        keyCell.setPaddingTop(2);
        keyCell.setPaddingBottom(2);
        keyCell.setPaddingLeft(0);
        keyCell.setPaddingRight(6);

        PdfPCell valueCell = new PdfPCell(new Phrase(safe(value), valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(align);
        valueCell.setPaddingTop(2);
        valueCell.setPaddingBottom(2);
        valueCell.setPaddingLeft(0);
        valueCell.setPaddingRight(0);

        table.addCell(keyCell);
        table.addCell(valueCell);
    }

    private void addTotalsRow(PdfPTable table, String label, String amount, Font font, boolean emphasize) {
        PdfPCell left = new PdfPCell(new Phrase(label, font));
        left.setBorder(Rectangle.NO_BORDER);
        left.setHorizontalAlignment(Element.ALIGN_RIGHT);
        left.setPadding(3);

        PdfPCell right = new PdfPCell(new Phrase(amount, font));
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.setPadding(3);
        if (emphasize) {
            right.setBorderWidthTop(0.8f);
            right.setBorderColorTop(new java.awt.Color(40, 40, 40));
        }

        table.addCell(left);
        table.addCell(right);
    }

    private void addAccountRow(PdfPTable table, String label, String amount, Font font, boolean emphasize) {
        PdfPCell left = new PdfPCell(new Phrase(label, font));
        left.setBorder(Rectangle.NO_BORDER);
        left.setHorizontalAlignment(Element.ALIGN_LEFT);
        left.setPaddingTop(4);
        left.setPaddingBottom(4);
        left.setPaddingLeft(2);

        PdfPCell right = new PdfPCell(new Phrase(amount, font));
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.setPaddingTop(4);
        right.setPaddingBottom(4);
        right.setPaddingRight(2);
        if (emphasize) {
            left.setBorderWidthTop(0.8f);
            right.setBorderWidthTop(0.8f);
            left.setBorderColorTop(new java.awt.Color(40, 40, 40));
            right.setBorderColorTop(new java.awt.Color(40, 40, 40));
        }

        table.addCell(left);
        table.addCell(right);
    }

    private void addPaymentRow(PdfPTable table, String key, String value, Font font) {
        PdfPCell keyCell = new PdfPCell(new Phrase(key, font));
        keyCell.setPaddingTop(6);
        keyCell.setPaddingBottom(6);
        keyCell.setPaddingLeft(6);
        keyCell.setBackgroundColor(new java.awt.Color(248, 248, 248));
        table.addCell(keyCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(safe(value), font));
        valueCell.setPaddingTop(6);
        valueCell.setPaddingBottom(6);
        valueCell.setPaddingLeft(6);
        table.addCell(valueCell);
    }

    private void addSignatureCell(PdfPTable table, String roleLabel, String signatoryName, Font bodyFont, Font boldFont) {
        PdfPTable signatureCard = new PdfPTable(1);
        signatureCard.setWidthPercentage(100);

        PdfPCell signArea = new PdfPCell(new Phrase(" ", bodyFont));
        signArea.setMinimumHeight(36f);
        signArea.setBorder(Rectangle.NO_BORDER);
        signatureCard.addCell(signArea);

        PdfPCell signLine = new PdfPCell(new Phrase(" ", bodyFont));
        signLine.setBorder(Rectangle.TOP);
        signLine.setPaddingTop(2);
        signLine.setPaddingBottom(2);
        signatureCard.addCell(signLine);

        PdfPCell roleCell = new PdfPCell(new Phrase(roleLabel, boldFont));
        roleCell.setBorder(Rectangle.NO_BORDER);
        roleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        roleCell.setPaddingTop(2);
        roleCell.setPaddingBottom(2);
        signatureCard.addCell(roleCell);

        PdfPCell nameCell = new PdfPCell(new Phrase(safe(signatoryName), bodyFont));
        nameCell.setBorder(Rectangle.NO_BORDER);
        nameCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        nameCell.setPaddingTop(0);
        nameCell.setPaddingBottom(2);
        signatureCard.addCell(nameCell);

        PdfPCell wrapper = new PdfPCell(signatureCard);
        wrapper.setBorder(Rectangle.BOX);
        wrapper.setBorderColor(new java.awt.Color(110, 110, 110));
        wrapper.setPaddingTop(6);
        wrapper.setPaddingBottom(6);
        wrapper.setPaddingLeft(8);
        wrapper.setPaddingRight(8);
        table.addCell(wrapper);
    }

    private String resolveCommitteeRoleName(Long societyId, Role role, SocietySetting setting, LocalDate referenceDate) {
        if (societyId == null || role == null) {
            return buildRoleFallback(role, setting, referenceDate);
        }

        List<User> roleUsers = userRepository.findBySocietyIdAndRole(societyId, role);
        for (User roleUser : roleUsers) {
            if (roleUser != null
                    && Boolean.TRUE.equals(roleUser.getIsActive())
                    && roleUser.getName() != null
                    && !roleUser.getName().isBlank()) {
                return roleUser.getName().trim();
            }
        }
        for (User roleUser : roleUsers) {
            if (roleUser != null && roleUser.getName() != null && !roleUser.getName().isBlank()) {
                return roleUser.getName().trim();
            }
        }

        return buildRoleFallback(role, setting, referenceDate);
    }

    private String buildRoleFallback(Role role, SocietySetting setting, LocalDate referenceDate) {
        String roleLabel = role == Role.SECRETARY
                ? "Secretary"
                : role == Role.TREASURER ? "Treasurer" : "Chairman";

        if (isElectionInProgress(setting, referenceDate)) {
            return roleLabel + " is not assigned (election in progress)";
        }
        return roleLabel + " is not assigned";
    }

    private boolean isElectionInProgress(SocietySetting setting, LocalDate referenceDate) {
        if (setting == null || referenceDate == null
                || setting.getCommitteeElectionStartDate() == null
                || setting.getCommitteeElectionEndDate() == null) {
            return false;
        }

        LocalDate start = setting.getCommitteeElectionStartDate();
        LocalDate end = setting.getCommitteeElectionEndDate();
        if (start.isAfter(end)) {
            return false;
        }
        return !referenceDate.isBefore(start) && !referenceDate.isAfter(end);
    }

    private String resolveInvoiceNumber(MaintenanceBill bill, SocietySetting setting) {
        if (bill.getBillNumber() != null && !bill.getBillNumber().isBlank()) {
            return bill.getBillNumber();
        }
        String prefix = setting != null && setting.getBillNumberPrefix() != null && !setting.getBillNumberPrefix().isBlank()
                ? setting.getBillNumberPrefix()
                : "BILL";
        return prefix + "-" + bill.getBillMonth() + "-" + bill.getId();
    }

    private String formatBillMonthLabel(String billMonth) {
        try {
            return YearMonth.parse(billMonth).format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));
        } catch (Exception ignored) {
            return safe(billMonth);
        }
    }

    private String resolveClientName(Flat flat) {
        if (flat == null) {
            return "-";
        }
        if (flat.getOwnerName() != null && !flat.getOwnerName().isBlank()) {
            return flat.getOwnerName().trim();
        }
        if (flat.getOwner() != null && flat.getOwner().getName() != null && !flat.getOwner().getName().isBlank()) {
            return flat.getOwner().getName().trim();
        }

        List<User> users = userRepository.findByFlatId(flat.getId());
        for (User user : users) {
            if (user != null && Boolean.TRUE.equals(user.getIsActive())
                    && (user.getRole() == Role.MEMBER || user.getRole() == Role.TENANT)
                    && user.getName() != null && !user.getName().isBlank()) {
                return user.getName().trim();
            }
        }
        for (User user : users) {
            if (user != null && Boolean.TRUE.equals(user.getIsActive())
                    && user.getName() != null && !user.getName().isBlank()) {
                return user.getName().trim();
            }
        }

        List<Tenant> tenants = tenantRepository.findByFlatIdAndIsActiveTrue(flat.getId());
        for (Tenant tenant : tenants) {
            if (tenant != null && tenant.getName() != null && !tenant.getName().isBlank()) {
                return tenant.getName().trim();
            }
        }
        return "-";
    }

    private String buildHeaderLine(Society society) {
        if (society == null) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        if (society.getAddress() != null && !society.getAddress().isBlank()) {
            parts.add("Address: " + society.getAddress());
        }
        if (society.getCity() != null && !society.getCity().isBlank()) {
            parts.add(society.getCity());
        }
        if (society.getState() != null && !society.getState().isBlank()) {
            parts.add(society.getState());
        }
        if (society.getPincode() != null && !society.getPincode().isBlank()) {
            parts.add(society.getPincode());
        }
        if (society.getRegistrationNumber() != null && !society.getRegistrationNumber().isBlank()) {
            parts.add("Reg: " + society.getRegistrationNumber());
        }
        if (society.getEmail() != null && !society.getEmail().isBlank()) {
            parts.add("Email: " + society.getEmail());
        }
        if (society.getTelephone() != null && !society.getTelephone().isBlank()) {
            parts.add("Phone: " + society.getTelephone());
        }
        return String.join("  |  ", parts);
    }

    private String resolvePaymentLink(SocietySetting setting, Long billId) {
        if (setting != null && setting.getPaymentLink() != null && !setting.getPaymentLink().isBlank()) {
            return setting.getPaymentLink().trim();
        }
        String base = frontendUrl != null && !frontendUrl.isBlank() ? frontendUrl.trim() : "http://localhost:5173";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/#/my-bills?billId=" + billId;
    }

    private byte[] generateQrCode(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix bitMatrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 220, 220, hints);
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | java.io.IOException ignored) {
            return null;
        }
    }

    private String formatMoney(BigDecimal value) {
        BigDecimal normalized = value != null ? value : BigDecimal.ZERO;
        return normalized.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatPercent(BigDecimal value) {
        BigDecimal normalized = value != null ? value : BigDecimal.ZERO;
        return normalized.setScale(2, RoundingMode.HALF_UP).toPlainString() + "%";
    }

    private String formatAreaSqft(Flat flat) {
        if (flat == null || flat.getArea() == null) {
            return "-";
        }
        return flat.getArea().setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private List<InvoiceDisplayLineItem> buildInvoiceDisplayItems(MaintenanceBill bill) {
        LinkedHashMap<String, InvoiceDisplayLineItem> standardItems = new LinkedHashMap<>();
        standardItems.put("MAINTENANCE", new InvoiceDisplayLineItem("Maintenance charge", BigDecimal.ZERO));
        standardItems.put("SINKING_FUND", new InvoiceDisplayLineItem("Sinking fund", BigDecimal.ZERO));
        standardItems.put("REPAIR_FUND", new InvoiceDisplayLineItem("Repair fund", BigDecimal.ZERO));
        standardItems.put("WATER_CHARGES", new InvoiceDisplayLineItem("Water charges", BigDecimal.ZERO));
        standardItems.put("WATER_CHARGES_PER_PERSON", new InvoiceDisplayLineItem("Water charges (per person)", BigDecimal.ZERO));
        standardItems.put("LIFT_MAINTENANCE", new InvoiceDisplayLineItem("Lift maintenance", BigDecimal.ZERO));
        standardItems.put("ELECTRICITY_COMMON", new InvoiceDisplayLineItem("Common electricity", BigDecimal.ZERO));
        standardItems.put("SECURITY_CHARGE", new InvoiceDisplayLineItem("Security charge", BigDecimal.ZERO));
        standardItems.put("INSURANCE", new InvoiceDisplayLineItem("Insurance", BigDecimal.ZERO));
        standardItems.put("CLUB_HOUSE", new InvoiceDisplayLineItem("Club house", BigDecimal.ZERO));
        standardItems.put("PROPERTY_TAX", new InvoiceDisplayLineItem("Property tax share", BigDecimal.ZERO));
        standardItems.put("PARKING_TWO_WHEELER", new InvoiceDisplayLineItem("Parking (two wheeler)", BigDecimal.ZERO));
        standardItems.put("PARKING_OPEN", new InvoiceDisplayLineItem("Parking (open)", BigDecimal.ZERO));
        standardItems.put("PARKING_COVERED", new InvoiceDisplayLineItem("Parking (covered)", BigDecimal.ZERO));
        standardItems.put("PARKING_STILT", new InvoiceDisplayLineItem("Parking (stilt)", BigDecimal.ZERO));
        standardItems.put("NON_OCCUPANCY_SURCHARGE", new InvoiceDisplayLineItem("Non-occupancy surcharge", BigDecimal.ZERO));

        List<InvoiceDisplayLineItem> additionalItems = new ArrayList<>();
        if (bill != null && bill.getLineItems() != null) {
            for (BillLineItem lineItem : bill.getLineItems()) {
                if (lineItem == null) {
                    continue;
                }

                String chargeType = lineItem.getChargeType() != null ? lineItem.getChargeType().trim() : "";
                String description = lineItem.getDescription() != null && !lineItem.getDescription().isBlank()
                        ? lineItem.getDescription().trim()
                        : (chargeType.isBlank() ? "Other charge" : chargeType);
                BigDecimal amount = lineItem.getAmount() != null ? lineItem.getAmount() : BigDecimal.ZERO;
                if (isParkingChargeType(chargeType)) {
                    description = appendVehicleCountLabel(description, lineItem.getQuantity());
                }

                if (standardItems.containsKey(chargeType)) {
                    standardItems.put(chargeType, new InvoiceDisplayLineItem(description, amount));
                } else {
                    additionalItems.add(new InvoiceDisplayLineItem(description, amount));
                }
            }
        }

        List<InvoiceDisplayLineItem> merged = new ArrayList<>(standardItems.values());
        merged.addAll(additionalItems);
        return merged;
    }

    private boolean isParkingChargeType(String chargeType) {
        if (chargeType == null) {
            return false;
        }
        return "PARKING_TWO_WHEELER".equals(chargeType)
                || "PARKING_OPEN".equals(chargeType)
                || "PARKING_COVERED".equals(chargeType)
                || "PARKING_STILT".equals(chargeType);
    }

    private String appendVehicleCountLabel(String description, BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ONE) <= 0) {
            return description;
        }
        String countText = quantity.stripTrailingZeros().toPlainString();
        return description + " (" + countText + " vehicles)";
    }

    private InvoiceBreakdown calculateInvoiceBreakdown(
            MaintenanceBill currentBill,
            SocietySetting setting,
            BigDecimal baseAmount,
            ChargesBreakdown currentOverdue,
            BigDecimal currentPayableAmount) {
        BigDecimal taxableBase = BigDecimal.ZERO;
        BigDecimal gstTaxAmount = BigDecimal.ZERO;
        if (currentBill.getLineItems() != null && !currentBill.getLineItems().isEmpty()) {
            for (BillLineItem lineItem : currentBill.getLineItems()) {
                BigDecimal amount = lineItem.getAmount() != null ? lineItem.getAmount() : BigDecimal.ZERO;
                if (Boolean.TRUE.equals(lineItem.getIsTaxable())) {
                    taxableBase = taxableBase.add(amount);
                }
                if (lineItem.getChargeType() != null && lineItem.getChargeType().equalsIgnoreCase("GST")) {
                    gstTaxAmount = gstTaxAmount.add(amount);
                }
            }
        }
        if (gstTaxAmount.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal configuredGstPct = setting != null && setting.getGstPercentage() != null
                    ? setting.getGstPercentage()
                    : BigDecimal.ZERO;
            if (configuredGstPct.compareTo(BigDecimal.ZERO) > 0 && taxableBase.compareTo(BigDecimal.ZERO) > 0) {
                gstTaxAmount = taxableBase.multiply(configuredGstPct)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else if (currentBill.getTaxAmount() != null) {
                gstTaxAmount = currentBill.getTaxAmount();
            }
        }

        PreviousPendingBreakdown previousPending = calculatePreviousPendingBreakdown(currentBill);
        BigDecimal advanceBalance = currentBill.getAdvanceBalance() != null ? currentBill.getAdvanceBalance() : BigDecimal.ZERO;

        BigDecimal totalOutstanding = currentPayableAmount
                .add(previousPending.charges)
                .add(previousPending.interest)
                .subtract(advanceBalance);
        if (totalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            totalOutstanding = BigDecimal.ZERO;
        }

        return new InvoiceBreakdown(
                taxableBase,
                gstTaxAmount,
                baseAmount.add(currentOverdue.interest).add(currentOverdue.penalty),
                previousPending.charges,
                previousPending.interest,
                totalOutstanding);
    }

    private PreviousPendingBreakdown calculatePreviousPendingBreakdown(MaintenanceBill currentBill) {
        if (currentBill == null || currentBill.getFlat() == null || currentBill.getFlat().getId() == null) {
            return PreviousPendingBreakdown.zero();
        }

        List<MaintenanceBill> allFlatBills = maintenanceBillRepository.findByFlatId(currentBill.getFlat().getId());
        BigDecimal previousCharges = BigDecimal.ZERO;
        BigDecimal previousInterest = BigDecimal.ZERO;
        String currentMonth = currentBill.getBillMonth();

        for (MaintenanceBill previousBill : allFlatBills) {
            if (previousBill.getId() == null || previousBill.getId().equals(currentBill.getId())) {
                continue;
            }
            if (previousBill.getBillMonth() == null || currentMonth == null || previousBill.getBillMonth().compareTo(currentMonth) >= 0) {
                continue;
            }

            BigDecimal previousBase = (previousBill.getTotalAmount() != null && previousBill.getTotalAmount().compareTo(BigDecimal.ZERO) > 0)
                    ? previousBill.getTotalAmount()
                    : (previousBill.getAmount() != null ? previousBill.getAmount() : BigDecimal.ZERO);
            ChargesBreakdown previousOverdue = calculateOverdueCharges(previousBill, previousBase);
            BigDecimal previousPayable = previousBase.add(previousOverdue.interest).add(previousOverdue.penalty);
            BigDecimal alreadyPaid = previousBill.getPaidAmount() != null ? previousBill.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal pending = previousPayable.subtract(alreadyPaid);
            if (pending.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            previousCharges = previousCharges.add(previousBase.subtract(alreadyPaid).max(BigDecimal.ZERO));
            previousInterest = previousInterest.add(previousOverdue.interest).add(previousOverdue.penalty);
        }

        return new PreviousPendingBreakdown(previousCharges, previousInterest);
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
        BigDecimal baseAmount = (bill.getTotalAmount() != null && bill.getTotalAmount().compareTo(BigDecimal.ZERO) > 0)
                ? bill.getTotalAmount()
                : (bill.getAmount() != null ? bill.getAmount() : BigDecimal.ZERO);

        ChargesBreakdown overdueCharges = calculateOverdueCharges(bill, baseAmount);
        return baseAmount.add(overdueCharges.interest).add(overdueCharges.penalty);
    }

    private BigDecimal resolveCarryForwardPending(Long flatId, String newBillMonth) {
        if (flatId == null || newBillMonth == null || newBillMonth.isBlank()) {
            return BigDecimal.ZERO;
        }

        List<MaintenanceBill> existingBills = maintenanceBillRepository.findByFlatId(flatId);
        return existingBills.stream()
                .filter(b -> b.getBillMonth() != null)
                .filter(b -> b.getBillMonth().compareTo(newBillMonth) < 0)
                .max(Comparator.comparing(MaintenanceBill::getBillMonth))
                .map(this::computePendingAmount)
                .orElse(BigDecimal.ZERO)
                .max(BigDecimal.ZERO);
    }

    private BigDecimal computePendingAmount(MaintenanceBill bill) {
        BigDecimal payable = getPayableAmount(bill);
        BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal pending = payable.subtract(paid);
        return pending.compareTo(BigDecimal.ZERO) > 0 ? pending : BigDecimal.ZERO;
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
        int occupantCount = resolveOccupantCount(flat);
        if (occupantCount > 0) {
            addItem(items, "WATER_CHARGES_PER_PERSON", "Water charges (per person)", setting.getWaterChargesPerPerson(),
                BigDecimal.valueOf(occupantCount), true);
        }
        addItem(items, "LIFT_MAINTENANCE", "Lift maintenance", setting.getLiftMaintenanceCharge(), BigDecimal.ONE, true);
        addItem(items, "ELECTRICITY_COMMON", "Common electricity", setting.getElectricityCommonCharge(), BigDecimal.ONE, true);
        addItem(items, "SECURITY_CHARGE", "Security charge", setting.getSecurityCharge(), BigDecimal.ONE, true);
        addItem(items, "INSURANCE", "Insurance", setting.getInsuranceCharge(), BigDecimal.ONE, false);
        addItem(items, "CLUB_HOUSE", "Club house", setting.getClubHouseCharge(), BigDecimal.ONE, true);
        addItem(items, "PROPERTY_TAX", "Property tax share", setting.getPropertyTaxShare(), BigDecimal.ONE, false);
        addParkingUsageItems(items, flat, setting);

        if (Boolean.FALSE.equals(flat.getIsOccupied())
            && setting.getNonOccupancySurchargePct() != null
            && setting.getNonOccupancySurchargePct().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal baseForSurcharge = items.stream()
                .filter(item -> "MAINTENANCE".equals(item.getChargeType()))
                .map(BillLineItem::getAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO);
            if (baseForSurcharge.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal surchargeRate = setting.getNonOccupancySurchargePct();
            BigDecimal surchargeAmount = baseForSurcharge.multiply(surchargeRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            addItem(items, "NON_OCCUPANCY_SURCHARGE",
                "Non-occupancy surcharge @ " + surchargeRate + "%", surchargeAmount, BigDecimal.ONE, false);
            BillLineItem surchargeLine = items.get(items.size() - 1);
            surchargeLine.setRate(surchargeRate);
            }
        }

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

    private void addParkingUsageItems(List<BillLineItem> items, Flat flat, SocietySetting setting) {
        if (flat == null || flat.getId() == null || setting == null) {
            return;
        }

        List<Vehicle> unitVehicles = vehicleRepository.findByFlatId(flat.getId());
        if (unitVehicles.isEmpty()) {
            return;
        }

        long twoWheelerCount = unitVehicles.stream()
                .filter(vehicle -> "TWO_WHEELER".equalsIgnoreCase(vehicle.getVehicleType()))
                .filter(vehicle -> hasParkingUsage(vehicle.getParkingSlot()))
                .count();
        addItem(items, "PARKING_TWO_WHEELER", "Parking (two-wheeler)", setting.getParkingChargeTwoWheeler(),
                BigDecimal.valueOf(twoWheelerCount), true);

        long fourWheelerOpenCount = unitVehicles.stream()
                .filter(vehicle -> "FOUR_WHEELER".equalsIgnoreCase(vehicle.getVehicleType()))
                .filter(vehicle -> hasParkingUsage(vehicle.getParkingSlot()))
                .filter(vehicle -> resolveParkingCategory(vehicle.getParkingSlot()).equals("OPEN"))
                .count();
        addItem(items, "PARKING_OPEN", "Parking (open)", setting.getParkingChargeOpen(),
                BigDecimal.valueOf(fourWheelerOpenCount), true);

        long fourWheelerCoveredCount = unitVehicles.stream()
                .filter(vehicle -> "FOUR_WHEELER".equalsIgnoreCase(vehicle.getVehicleType()))
                .filter(vehicle -> hasParkingUsage(vehicle.getParkingSlot()))
                .filter(vehicle -> resolveParkingCategory(vehicle.getParkingSlot()).equals("COVERED"))
                .count();
        addItem(items, "PARKING_COVERED", "Parking (covered)", setting.getParkingChargeCovered(),
                BigDecimal.valueOf(fourWheelerCoveredCount), true);

        long fourWheelerStiltCount = unitVehicles.stream()
                .filter(vehicle -> "FOUR_WHEELER".equalsIgnoreCase(vehicle.getVehicleType()))
                .filter(vehicle -> hasParkingUsage(vehicle.getParkingSlot()))
                .filter(vehicle -> resolveParkingCategory(vehicle.getParkingSlot()).equals("STILT"))
                .count();
        addItem(items, "PARKING_STILT", "Parking (stilt)", setting.getParkingChargeStilt(),
                BigDecimal.valueOf(fourWheelerStiltCount), true);
    }

    private boolean hasParkingUsage(String parkingSlot) {
        return parkingSlot != null && !parkingSlot.trim().isEmpty();
    }

    private int resolveOccupantCount(Flat flat) {
        if (flat == null || flat.getId() == null) {
            return 0;
        }

        Set<Long> countedUserIds = new HashSet<>();
        int count = 0;

        List<User> linkedUsers = userRepository.findByFlatId(flat.getId());
        for (User user : linkedUsers) {
            if (user == null || user.getId() == null || Boolean.FALSE.equals(user.getIsActive())) {
                continue;
            }
            // Resident occupants are represented by MEMBER/TENANT user roles.
            if (user.getRole() == Role.MEMBER || user.getRole() == Role.TENANT) {
                if (countedUserIds.add(user.getId())) {
                    count++;
                }
            }
        }

        List<Tenant> activeTenants = tenantRepository.findByFlatIdAndIsActiveTrue(flat.getId());
        for (Tenant tenant : activeTenants) {
            if (tenant == null) {
                continue;
            }
            Long tenantUserId = tenant.getUser() != null ? tenant.getUser().getId() : null;
            if (tenantUserId != null) {
                if (countedUserIds.add(tenantUserId)) {
                    count++;
                }
            } else {
                // Tenant exists without a linked app user; still count as an occupant.
                count++;
            }
        }

        return Math.max(count, 0);
    }

    private String resolveParkingCategory(String parkingSlot) {
        if (parkingSlot == null || parkingSlot.isBlank()) {
            return "OPEN";
        }
        String normalized = parkingSlot.toLowerCase(Locale.ROOT);
        if (normalized.contains("stilt")) {
            return "STILT";
        }
        if (normalized.contains("cover")) {
            return "COVERED";
        }
        return "OPEN";
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

    private ChargesBreakdown calculateOverdueCharges(MaintenanceBill bill, BigDecimal baseAmount) {
        if (bill == null || bill.getSociety() == null) {
            return ChargesBreakdown.zero();
        }

        SocietySetting setting = getSocietySetting(bill.getSociety().getId());
        if (setting == null) {
            return ChargesBreakdown.zero();
        }

        LocalDate effectiveDueDate = bill.getDueDate();
        if (effectiveDueDate == null && bill.getBillMonth() != null && !bill.getBillMonth().isBlank()) {
            effectiveDueDate = resolveDueDate(bill.getBillMonth(), setting);
        }
        if (effectiveDueDate == null) {
            return ChargesBreakdown.zero();
        }

        LocalDate thresholdDate = effectiveDueDate.plusDays(setting.getGracePeriodDays() != null ? setting.getGracePeriodDays() : 0);
        LocalDate today = LocalDate.now();
        if (!today.isAfter(thresholdDate)) {
            return ChargesBreakdown.zero();
        }

        BigDecimal outstandingBase = baseAmount.subtract(bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO);
        if (outstandingBase.compareTo(BigDecimal.ZERO) <= 0) {
            return ChargesBreakdown.zero();
        }

        long overdueDays = java.time.temporal.ChronoUnit.DAYS.between(thresholdDate, today);
        BigDecimal interest = BigDecimal.ZERO;
        if (setting.getLatePaymentInterestPct() != null && setting.getLatePaymentInterestPct().compareTo(BigDecimal.ZERO) > 0) {
            // Monthly interest prorated by overdue days.
            interest = outstandingBase
                    .multiply(setting.getLatePaymentInterestPct())
                    .multiply(BigDecimal.valueOf(overdueDays))
                    .divide(BigDecimal.valueOf(100 * 30), 2, RoundingMode.HALF_UP);
        }

        BigDecimal penalty = BigDecimal.ZERO;
        if (setting.getPenaltyFixed() != null && setting.getPenaltyFixed().compareTo(BigDecimal.ZERO) > 0) {
            penalty = setting.getPenaltyFixed();
        }

        return new ChargesBreakdown(interest, penalty);
    }

    private static final class ChargesBreakdown {
        private final BigDecimal interest;
        private final BigDecimal penalty;

        private ChargesBreakdown(BigDecimal interest, BigDecimal penalty) {
            this.interest = interest != null ? interest : BigDecimal.ZERO;
            this.penalty = penalty != null ? penalty : BigDecimal.ZERO;
        }

        private static ChargesBreakdown zero() {
            return new ChargesBreakdown(BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }

    private static final class PreviousPendingBreakdown {
        private final BigDecimal charges;
        private final BigDecimal interest;

        private PreviousPendingBreakdown(BigDecimal charges, BigDecimal interest) {
            this.charges = charges != null ? charges : BigDecimal.ZERO;
            this.interest = interest != null ? interest : BigDecimal.ZERO;
        }

        private static PreviousPendingBreakdown zero() {
            return new PreviousPendingBreakdown(BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }

    private static final class InvoiceBreakdown {
        private final BigDecimal taxableBase;
        private final BigDecimal gstTaxAmount;
        private final BigDecimal currentBillSubtotal;
        private final BigDecimal previousPendingCharges;
        private final BigDecimal previousPendingInterest;
        private final BigDecimal totalOutstanding;

        private InvoiceBreakdown(
                BigDecimal taxableBase,
                BigDecimal gstTaxAmount,
                BigDecimal currentBillSubtotal,
                BigDecimal previousPendingCharges,
                BigDecimal previousPendingInterest,
                BigDecimal totalOutstanding) {
            this.taxableBase = taxableBase != null ? taxableBase : BigDecimal.ZERO;
            this.gstTaxAmount = gstTaxAmount != null ? gstTaxAmount : BigDecimal.ZERO;
            this.currentBillSubtotal = currentBillSubtotal != null ? currentBillSubtotal : BigDecimal.ZERO;
            this.previousPendingCharges = previousPendingCharges != null ? previousPendingCharges : BigDecimal.ZERO;
            this.previousPendingInterest = previousPendingInterest != null ? previousPendingInterest : BigDecimal.ZERO;
            this.totalOutstanding = totalOutstanding != null ? totalOutstanding : BigDecimal.ZERO;
        }
    }

    private static final class InvoiceDisplayLineItem {
        private final String description;
        private final BigDecimal amount;

        private InvoiceDisplayLineItem(String description, BigDecimal amount) {
            this.description = description;
            this.amount = amount != null ? amount : BigDecimal.ZERO;
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
        BigDecimal baseAmount = (bill.getTotalAmount() != null && bill.getTotalAmount().compareTo(BigDecimal.ZERO) > 0)
            ? bill.getTotalAmount()
            : (bill.getAmount() != null ? bill.getAmount() : BigDecimal.ZERO);
        ChargesBreakdown overdueCharges = calculateOverdueCharges(bill, baseAmount);
        BigDecimal payableAmount = baseAmount.add(overdueCharges.interest).add(overdueCharges.penalty);

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
        response.setInterestAmount(overdueCharges.interest);
        response.setPenaltyAmount(overdueCharges.penalty);
        response.setTotalAmount(payableAmount);
        response.setPreviousBalance(bill.getPreviousBalance());
        response.setAdvanceBalance(bill.getAdvanceBalance());
        response.setPaidAmount(bill.getPaidAmount());
        response.setPendingAmount(payableAmount.subtract(bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO));
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
