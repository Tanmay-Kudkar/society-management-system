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
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
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
        bill.setReceivedByRole(request.getReceivedByRole());
        bill.setReceivedByName(request.getReceivedByName());
        bill.setPaymentNotes(request.getPaymentNotes());

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
            String receivedByRole, String receivedByName, String paymentNotes, Long userId) {
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
        bill.setReceivedByRole(receivedByRole);
        bill.setReceivedByName(receivedByName);
        bill.setPaymentNotes(paymentNotes);

        updateBillStatus(bill);

        if ("PAID".equals(bill.getStatus())) {
            bill.setPaidAt(LocalDateTime.now());
        }

        VendorBill saved = vendorBillRepository.save(bill);
        
        // Auto-create expense transaction for this payment
        createExpenseTransaction(saved, amount, paymentMode, referenceNumber, userId);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public VendorBillResponse recordOnlinePayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId) {
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

    @Override
    public byte[] downloadReceiptPdf(Long billId, Long userId) {
        User requester = roleService.getUser(userId);
        VendorBill bill = vendorBillRepository.findById(billId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor bill not found"));

        if (requester.getRole() != Role.MASTER_ADMIN) {
            Long billSocietyId = bill.getSociety() != null ? bill.getSociety().getId() : null;
            roleService.enforceSocietyScope(requester, billSocietyId);
        }

        if ((bill.getPaidAmount() == null || bill.getPaidAmount().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Receipt is available only after payment");
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font bodyBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            Paragraph title = new Paragraph("Vendor Payment Receipt", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(14);
            document.add(title);

            String receiptNo = "VPR-" + bill.getId() + "-" + LocalDate.now().toString().replace("-", "");

            PdfPTable summary = new PdfPTable(new float[] { 1f, 2f, 1f, 2f });
            summary.setWidthPercentage(100);
            summary.setSpacingAfter(12);
            addSummaryCell(summary, "Receipt #", bodyBold);
            addSummaryCell(summary, receiptNo, bodyFont);
            addSummaryCell(summary, "Date", bodyBold);
            addSummaryCell(summary, String.valueOf(LocalDate.now()), bodyFont);
            addSummaryCell(summary, "Status", bodyBold);
            addSummaryCell(summary, safe(bill.getStatus()), bodyFont);
            addSummaryCell(summary, "Bill #", bodyBold);
            addSummaryCell(summary, safe(bill.getBillNumber()), bodyFont);
            document.add(summary);

            PdfPTable details = new PdfPTable(new float[] { 1.4f, 2.6f });
            details.setWidthPercentage(100);
            details.setSpacingAfter(12);
            addDetailRow(details, "Society", bill.getSociety() != null ? bill.getSociety().getName() : "-", bodyBold, bodyFont);
            addDetailRow(details, "Vendor", bill.getVendor() != null ? bill.getVendor().getName() : "-", bodyBold, bodyFont);
            addDetailRow(details, "Bill Date", bill.getBillDate() != null ? String.valueOf(bill.getBillDate()) : "-", bodyBold, bodyFont);
            addDetailRow(details, "Due Date", bill.getDueDate() != null ? String.valueOf(bill.getDueDate()) : "-", bodyBold, bodyFont);
            addDetailRow(details, "Payment Mode", safe(bill.getPaymentMode()), bodyBold, bodyFont);
            addDetailRow(details, "Reference", safe(bill.getReferenceNumber()), bodyBold, bodyFont);
            addDetailRow(details, "Received By (Role)", safe(bill.getReceivedByRole()), bodyBold, bodyFont);
            addDetailRow(details, "Received By (Name)", safe(bill.getReceivedByName()), bodyBold, bodyFont);
            addDetailRow(details, "Payment Notes", safe(bill.getPaymentNotes()), bodyBold, bodyFont);
            addDetailRow(details, "Paid At", bill.getPaidAt() != null ? String.valueOf(bill.getPaidAt()) : "-", bodyBold, bodyFont);
            document.add(details);

            PdfPTable amounts = new PdfPTable(new float[] { 2.5f, 1.5f });
            amounts.setWidthPercentage(60);
            amounts.setHorizontalAlignment(Element.ALIGN_RIGHT);
            amounts.setSpacingAfter(14);
            addAmountRow(amounts, "Bill Amount", "₹" + formatMoney(bill.getAmount()), bodyFont, false);
            addAmountRow(amounts, "Paid Amount", "₹" + formatMoney(bill.getPaidAmount()), bodyBold, false);
            addAmountRow(amounts, "Pending Amount", "₹" + formatMoney(bill.getPendingAmount()), bodyBold, true);
            document.add(amounts);

            PdfPCell noteBox = new PdfPCell(new Phrase(
                    "This is a system-generated receipt for vendor bill payment.",
                    bodyFont));
            noteBox.setPadding(8);
            noteBox.setBorder(Rectangle.BOX);
            noteBox.setBorderColor(new java.awt.Color(110, 110, 110));
            PdfPTable noteTable = new PdfPTable(1);
            noteTable.setWidthPercentage(100);
            noteTable.addCell(noteBox);
            document.add(noteTable);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate receipt PDF: " + ex.getMessage());
        }
    }

    private void addSummaryCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(safe(text), font));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addDetailRow(PdfPTable table, String key, String value, Font keyFont, Font valueFont) {
        PdfPCell keyCell = new PdfPCell(new Phrase(key, keyFont));
        keyCell.setPadding(6);
        table.addCell(keyCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(safe(value), valueFont));
        valueCell.setPadding(6);
        table.addCell(valueCell);
    }

    private void addAmountRow(PdfPTable table, String label, String value, Font font, boolean highlight) {
        PdfPCell left = new PdfPCell(new Phrase(label, font));
        left.setPadding(6);
        if (highlight) {
            left.setBackgroundColor(new java.awt.Color(246, 248, 252));
        }
        table.addCell(left);

        PdfPCell right = new PdfPCell(new Phrase(value, font));
        right.setPadding(6);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (highlight) {
            right.setBackgroundColor(new java.awt.Color(246, 248, 252));
        }
        table.addCell(right);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String formatMoney(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        return safeAmount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
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
        response.setReceivedByRole(bill.getReceivedByRole());
        response.setReceivedByName(bill.getReceivedByName());
        response.setPaymentNotes(bill.getPaymentNotes());
        response.setCreatedAt(bill.getCreatedAt());
        response.setPaidAt(bill.getPaidAt());
        return response;
    }
}
