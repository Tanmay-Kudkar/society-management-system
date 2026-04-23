package com.society.backend.common.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.finance.dto.response.FinancialReportResponse;
import com.society.backend.finance.service.ReportService;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.finance.repository.PaymentRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.finance.repository.TransactionRepository;
import com.society.backend.vendor.repository.VendorBillRepository;
import com.society.backend.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.society.backend.finance.entity.MaintenanceBill;
import com.society.backend.finance.entity.Payment;
import com.society.backend.finance.entity.Transaction;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Ticket;
import com.society.backend.vendor.entity.Vendor;
import com.society.backend.vendor.entity.VendorBill;
@Service
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExcelExportService {

    private static final DateTimeFormatter EXPORT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter EXPORT_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter EXPORT_MONTH_FORMAT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final TransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final VendorBillRepository vendorBillRepository;
    private final VendorRepository vendorRepository;
    private final TicketRepository ticketRepository;
    private final FlatRepository flatRepository;
    private final ReportService reportService;

    @Override
    public ByteArrayOutputStream exportTransactions(Long societyId, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<Transaction> transactions;
        if (societyId != null) {
            transactions = transactionRepository.findBySocietyIdAndTransactionDateBetween(societyId, start, end);
        } else {
            transactions = transactionRepository.findByTransactionDateBetween(start, end);
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Transactions");

            // Create styles
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryCurrencyStyle = createSummaryCurrencyValueStyle(workbook);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            String titleText;
            if (start.getYear() <= 1947 && end.getYear() >= 3000) {
                titleText = "Transaction Report (All Transactions)";
            } else {
                titleText = "Transaction Report (" + startDate + " to " + endDate + ")";
            }
            titleCell.setCellValue(titleText);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 17));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Date", "Type", "Category", "Payment Mode", "Amount", "Reference",
                    "Cheque #", "Bank Name", "UPI ID", "Transaction ID / UTR", "Card Type", "Card Last 4",
                    "Payment Month", "Late Fee", "Discount", "Tax", "Unit/Flat", "Receipt #", "Invoice #", "Description" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 3;
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;

            for (Transaction t : transactions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(t.getId());

                Cell dateCell = row.createCell(1);
                dateCell.setCellValue(formatExportDate(t.getTransactionDate()));
                dateCell.setCellStyle(dateStyle);

                row.createCell(2).setCellValue(t.getTransactionType());
                row.createCell(3).setCellValue(t.getCategory());

                String mode = t.getPaymentMode();
                row.createCell(4).setCellValue(mode);

                Cell amountCell = row.createCell(5);
                amountCell.setCellValue(t.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                // Reference # — required for CHEQUE & ONLINE
                if (t.getReferenceNumber() != null && !t.getReferenceNumber().isBlank()) {
                    row.createCell(6).setCellValue(t.getReferenceNumber());
                } else if ("CASH".equals(mode)) {
                    row.createCell(6).setCellValue("N/A - Cash payment");
                } else {
                    row.createCell(6).setCellValue("Missing");
                }

                // Cheque # — only relevant for CHEQUE mode
                if (t.getChequeNumber() != null && !t.getChequeNumber().isBlank()) {
                    row.createCell(7).setCellValue(t.getChequeNumber());
                } else if ("CHEQUE".equals(mode)) {
                    row.createCell(7).setCellValue("Missing");
                } else {
                    row.createCell(7).setCellValue("N/A - Not a cheque payment");
                }

                // Bank Name — relevant for CHEQUE, BANK_TRANSFER, NET_BANKING, cards
                if (t.getBankName() != null && !t.getBankName().isBlank()) {
                    row.createCell(8).setCellValue(t.getBankName());
                } else if ("CASH".equals(mode) || "UPI".equals(mode) || "WALLET".equals(mode)) {
                    row.createCell(8).setCellValue("N/A");
                } else {
                    row.createCell(8).setCellValue("Missing");
                }

                // UPI ID — relevant for UPI mode
                if (t.getUpiId() != null && !t.getUpiId().isBlank()) {
                    row.createCell(9).setCellValue(t.getUpiId());
                } else if ("UPI".equals(mode)) {
                    row.createCell(9).setCellValue("Missing");
                } else {
                    row.createCell(9).setCellValue("N/A");
                }

                // Transaction ID / UTR — relevant for UPI, BANK_TRANSFER, cards, NET_BANKING, WALLET
                if (t.getUtrNumber() != null && !t.getUtrNumber().isBlank()) {
                    row.createCell(10).setCellValue(t.getUtrNumber());
                } else if ("CASH".equals(mode) || "CHEQUE".equals(mode)) {
                    row.createCell(10).setCellValue("N/A");
                } else {
                    row.createCell(10).setCellValue("Missing");
                }

                // Card Type — relevant for CREDIT_CARD, DEBIT_CARD
                if (t.getCardType() != null && !t.getCardType().isBlank()) {
                    row.createCell(11).setCellValue(t.getCardType());
                } else if ("CREDIT_CARD".equals(mode) || "DEBIT_CARD".equals(mode)) {
                    row.createCell(11).setCellValue("Missing");
                } else {
                    row.createCell(11).setCellValue("N/A");
                }

                // Card Last 4 — relevant for CREDIT_CARD, DEBIT_CARD
                if (t.getCardLastFourDigits() != null && !t.getCardLastFourDigits().isBlank()) {
                    row.createCell(12).setCellValue(t.getCardLastFourDigits());
                } else if ("CREDIT_CARD".equals(mode) || "DEBIT_CARD".equals(mode)) {
                    row.createCell(12).setCellValue("Missing");
                } else {
                    row.createCell(12).setCellValue("N/A");
                }

                // Payment Month — relevant for MAINTENANCE category
                if (t.getPaymentMonth() != null && !t.getPaymentMonth().isBlank()) {
                    row.createCell(13).setCellValue(t.getPaymentMonth());
                } else if ("MAINTENANCE".equals(t.getCategory())) {
                    row.createCell(13).setCellValue("Missing");
                } else {
                    row.createCell(13).setCellValue("N/A");
                }

                // Late Fee
                Cell lateFeeCell = row.createCell(14);
                if (t.getLateFee() != null && t.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    lateFeeCell.setCellValue(t.getLateFee().doubleValue());
                    lateFeeCell.setCellStyle(currencyStyle);
                } else {
                    lateFeeCell.setCellValue(0);
                    lateFeeCell.setCellStyle(currencyStyle);
                }

                // Discount
                Cell discountCell = row.createCell(15);
                if (t.getDiscount() != null && t.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
                    discountCell.setCellValue(t.getDiscount().doubleValue());
                    discountCell.setCellStyle(currencyStyle);
                } else {
                    discountCell.setCellValue(0);
                    discountCell.setCellStyle(currencyStyle);
                }

                // Tax Amount
                Cell taxCell = row.createCell(16);
                if (t.getTaxAmount() != null && t.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
                    taxCell.setCellValue(t.getTaxAmount().doubleValue());
                    taxCell.setCellStyle(currencyStyle);
                } else {
                    taxCell.setCellValue(0);
                    taxCell.setCellStyle(currencyStyle);
                }

                // Unit/Flat — relevant for MAINTENANCE income
                if (t.getFlat() != null && t.getFlat().getFlatNumber() != null) {
                    row.createCell(17).setCellValue(t.getFlat().getFlatNumber());
                } else if ("MAINTENANCE".equals(t.getCategory()) && "INCOME".equals(t.getTransactionType())) {
                    row.createCell(17).setCellValue("Missing - Unit not linked");
                } else {
                    row.createCell(17).setCellValue("N/A");
                }

                // Receipt #
                row.createCell(18).setCellValue(t.getReceiptNumber() != null && !t.getReceiptNumber().isBlank() ? t.getReceiptNumber() : "");

                // Invoice #
                row.createCell(19).setCellValue(t.getInvoiceNumber() != null && !t.getInvoiceNumber().isBlank() ? t.getInvoiceNumber() : "");

                row.createCell(20).setCellValue(t.getDescription() != null && !t.getDescription().isBlank() ? t.getDescription() : "No description provided");

                if ("INCOME".equals(t.getTransactionType())) {
                    totalIncome = totalIncome.add(t.getAmount());
                } else {
                    totalExpense = totalExpense.add(t.getAmount());
                }
            }
            int dataEndRow = rowNum - 1;

            // Summary section
            rowNum += 2;
            rowNum = writeSummaryTitleRow(sheet, rowNum, 4, 5, "SUMMARY", summaryHeaderStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 4, "Total Income", totalIncome, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 4, "Total Expense", totalExpense, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 4, "Net Balance", totalIncome.subtract(totalExpense), summaryLabelStyle, summaryCurrencyStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1);

            // Auto-size columns with minimum width
            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export transactions", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportMaintenanceBills(Long societyId, String month) {
        List<MaintenanceBill> bills;
        if (month != null && !month.isEmpty()) {
            bills = maintenanceBillRepository.findByBillMonth(month);
        } else {
            bills = maintenanceBillRepository.findAll();
        }

        // Filter by society if needed
        if (societyId != null) {
            bills = bills.stream()
                    .filter(b -> b.getFlat().getSociety().getId().equals(societyId))
                    .toList();
        }

        if (bills.isEmpty()) {
            String monthLabel = month != null && !month.isBlank() ? formatExportMonth(month) : "selected period";
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "No maintenance bills found for " + monthLabel + " in the selected society.");
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Maintenance Bills");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryValueStyle = createSummaryValueStyle(workbook);
            CellStyle summaryCurrencyStyle = createSummaryCurrencyValueStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Maintenance Bills Report" + (month != null ? " - " + formatExportMonth(month) : ""));
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Flat", "Society", "Amount", "Paid Amount", "Due Date", "Status", "Payment Mode" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowNum = 3;
            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;

            for (MaintenanceBill b : bills) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.getFlat().getFlatNumber());
                row.createCell(2).setCellValue(b.getFlat().getSociety().getName());

                Cell amountCell = row.createCell(3);
                amountCell.setCellValue(b.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                Cell paidCell = row.createCell(4);
                paidCell.setCellValue(b.getPaidAmount() != null ? b.getPaidAmount().doubleValue() : 0);
                paidCell.setCellStyle(currencyStyle);

                row.createCell(5).setCellValue(formatExportDate(b.getDueDate()));
                row.createCell(6).setCellValue(b.getStatus());
                row.createCell(7).setCellValue(b.getPaymentMode() != null ? b.getPaymentMode() : "");

                totalAmount = totalAmount.add(b.getAmount());
                if (b.getPaidAmount() != null) {
                    totalPaid = totalPaid.add(b.getPaidAmount());
                }
            }
            int dataEndRow = rowNum - 1;

            // Summary
            rowNum += 2;
            rowNum = writeSummaryTitleRow(sheet, rowNum, 3, 4, "SUMMARY", summaryHeaderStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 3, "Total Bills", bills.size(), summaryLabelStyle, summaryValueStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 3, "Total Amount", totalAmount, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 3, "Total Collected", totalPaid, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 3, "Pending", totalAmount.subtract(totalPaid), summaryLabelStyle, summaryCurrencyStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1, 6);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export maintenance bills", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportVendorBills(Long societyId, String startDate, String endDate) {
        List<VendorBill> bills;
        if (societyId != null) {
            bills = vendorBillRepository.findBySocietyId(societyId);
        } else {
            bills = vendorBillRepository.findAll();
        }

        // Filter by date range if provided
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            bills = bills.stream()
                    .filter(b -> !b.getBillDate().isBefore(start) && !b.getBillDate().isAfter(end))
                    .toList();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Vendor Bills");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryCurrencyStyle = createSummaryCurrencyValueStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Vendor Bills Report");
            titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 14));

            // Headers
            Row headerRow = sheet.createRow(2);
                String[] headers = {
                    "ID", "Bill Number", "Vendor", "Bill Date", "Due Date", "Amount", "Paid", "Status",
                    "Overdue Days", "Payment Mode", "Reference", "Received By Role", "Received By Name",
                    "Payment Notes", "Description"
                };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowNum = 3;
            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;

            for (VendorBill b : bills) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.getBillNumber() != null ? b.getBillNumber() : "");
                row.createCell(2).setCellValue(b.getVendor().getName());
                row.createCell(3).setCellValue(formatExportDate(b.getBillDate()));
                row.createCell(4).setCellValue(formatExportDate(b.getDueDate()));

                Cell amountCell = row.createCell(5);
                amountCell.setCellValue(b.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                Cell paidCell = row.createCell(6);
                paidCell.setCellValue(b.getPaidAmount() != null ? b.getPaidAmount().doubleValue() : 0);
                paidCell.setCellStyle(currencyStyle);

                row.createCell(7).setCellValue(b.getStatus());
                row.createCell(8).setCellValue(b.getPendingDays());
                row.createCell(9).setCellValue(b.getPaymentMode() != null ? b.getPaymentMode() : "");
                row.createCell(10).setCellValue(b.getReferenceNumber() != null ? b.getReferenceNumber() : "");
                row.createCell(11).setCellValue(b.getReceivedByRole() != null ? b.getReceivedByRole() : "");
                row.createCell(12).setCellValue(b.getReceivedByName() != null ? b.getReceivedByName() : "");
                row.createCell(13).setCellValue(b.getPaymentNotes() != null ? b.getPaymentNotes() : "");
                row.createCell(14).setCellValue(b.getDescription() != null ? b.getDescription() : "");

                totalAmount = totalAmount.add(b.getAmount());
                if (b.getPaidAmount() != null) {
                    totalPaid = totalPaid.add(b.getPaidAmount());
                }
            }
            int dataEndRow = rowNum - 1;

            // Summary
            rowNum += 2;
            rowNum = writeSummaryTitleRow(sheet, rowNum, 8, 9, "SUMMARY", summaryHeaderStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 8, "Total Amount", totalAmount, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 8, "Total Paid", totalPaid, summaryLabelStyle, summaryCurrencyStyle);
            rowNum = writeSummaryCurrencyRow(sheet, rowNum, 8, "Pending", totalAmount.subtract(totalPaid), summaryLabelStyle, summaryCurrencyStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1, 7);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export vendor bills", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportVendors(Long societyId) {
        List<Vendor> vendors;
        if (societyId != null) {
            vendors = vendorRepository.findBySocietyId(societyId);
        } else {
            vendors = vendorRepository.findAll();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Vendors");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryValueStyle = createSummaryValueStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Vendors Directory");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 14));

            Row headerRow = sheet.createRow(2);
            String[] headers = {
                    "ID", "Vendor Name", "Service Type", "Society", "Contact Person", "Contact Phone",
                    "Contact Email", "Business Phone", "Business Email", "Address", "GST Number", "PAN Number",
                    "Approval Status", "Active", "Created At"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 3;
            for (Vendor v : vendors) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(v.getId() != null ? v.getId() : 0L);
                row.createCell(1).setCellValue(v.getName() != null ? v.getName() : "");
                row.createCell(2).setCellValue(v.getServiceType() != null ? v.getServiceType() : "");
                row.createCell(3).setCellValue(v.getSociety() != null && v.getSociety().getName() != null ? v.getSociety().getName() : "Common");
                row.createCell(4).setCellValue(v.getContactPerson() != null ? v.getContactPerson() : "");
                row.createCell(5).setCellValue(v.getContactPersonPhone() != null ? v.getContactPersonPhone() : "");
                row.createCell(6).setCellValue(v.getContactPersonEmail() != null ? v.getContactPersonEmail() : "");
                row.createCell(7).setCellValue(v.getPhone() != null ? v.getPhone() : "");
                row.createCell(8).setCellValue(v.getEmail() != null ? v.getEmail() : "");
                row.createCell(9).setCellValue(v.getAddress() != null ? v.getAddress() : "");
                row.createCell(10).setCellValue(v.getGstNumber() != null ? v.getGstNumber() : "");
                row.createCell(11).setCellValue(v.getPanNumber() != null ? v.getPanNumber() : "");
                row.createCell(12).setCellValue(v.getApprovalStatus() != null ? v.getApprovalStatus() : "PENDING");
                row.createCell(13).setCellValue(Boolean.TRUE.equals(v.getIsActive()) ? "Yes" : "No");
                row.createCell(14).setCellValue(formatExportDateTime(v.getCreatedAt()));
            }
            int dataEndRow = rowNum - 1;

            rowNum += 2;
            long approvedCount = vendors.stream().filter(v -> "APPROVED".equalsIgnoreCase(v.getApprovalStatus())).count();
            long activeCount = vendors.stream().filter(v -> Boolean.TRUE.equals(v.getIsActive())).count();
            rowNum = writeSummaryTitleRow(sheet, rowNum, 0, 1, "SUMMARY", summaryHeaderStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Total Vendors", vendors.size(), summaryLabelStyle, summaryValueStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Approved", approvedCount, summaryLabelStyle, summaryValueStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Active", activeCount, summaryLabelStyle, summaryValueStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1, 12);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export vendors", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportTickets(Long societyId, String status) {
        List<Ticket> tickets;
        if (societyId != null && status != null && !status.isEmpty()) {
            tickets = ticketRepository.findBySocietyIdAndStatus(societyId, status);
        } else if (societyId != null) {
            tickets = ticketRepository.findBySocietyId(societyId);
        } else if (status != null && !status.isEmpty()) {
            tickets = ticketRepository.findByStatus(status);
        } else {
            tickets = ticketRepository.findAll();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Tickets");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryValueStyle = createSummaryValueStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Tickets Report");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            // Headers
            Row headerRow = sheet.createRow(2);
            headerRow.setHeightInPoints(24f);
            String[] headers = {
                    "ID",
                    "Society",
                    "Title",
                    "Type",
                    "Priority",
                    "Status",
                    "Progress %",
                    "Pending Days",
                    "Raised By",
                    "Assigned To",
                    "Resolution / Latest Reply",
                    "Last Reply By",
                    "Last Reply At",
                    "Overdue",
                    "Overdue Days",
                    "Escalation Level",
                        "Created At"
                    };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowNum = 3;
            for (Ticket t : tickets) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getSociety() != null ? t.getSociety().getName() : "");
                row.createCell(2).setCellValue(t.getTitle());
                row.createCell(3).setCellValue(t.getType());
                row.createCell(4).setCellValue(t.getPriority());
                row.createCell(5).setCellValue(t.getStatus());
                row.createCell(6).setCellValue(t.getProgressPercent() != null ? t.getProgressPercent() : 0);
                row.createCell(7).setCellValue(t.getPendingDays());
                row.createCell(8).setCellValue(t.getRaisedBy() != null ? t.getRaisedBy().getName() : "");
                row.createCell(9).setCellValue(t.getAssignedTo() != null ? t.getAssignedTo().getName() : "Unassigned");
                row.createCell(10).setCellValue(t.getResolution() != null ? t.getResolution() : "");
                row.createCell(11).setCellValue(t.getLastReplyBy() != null ? t.getLastReplyBy() : "");
                row.createCell(12).setCellValue(formatExportDateTime(t.getLastReplyAt()));
                row.createCell(13).setCellValue(Boolean.TRUE.equals(t.getIsOverdue()) ? "Yes" : "No");
                row.createCell(14).setCellValue(t.getOverdueDays() != null ? t.getOverdueDays() : 0);
                row.createCell(15).setCellValue(t.getEscalationLevel() != null ? t.getEscalationLevel() : 0);
                row.createCell(16).setCellValue(formatExportDateTime(t.getCreatedAt()));
            }
            int dataEndRow = rowNum - 1;

            // Summary
            rowNum += 2;
            long open = tickets.stream().filter(t -> "OPEN".equals(t.getStatus())).count();
            long inProgress = tickets.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
            long resolved = tickets.stream().filter(t -> "RESOLVED".equals(t.getStatus())).count();
            long closed = tickets.stream().filter(t -> "CLOSED".equals(t.getStatus())).count();

            rowNum = writeSummaryTitleRow(sheet, rowNum, 0, 2, "SUMMARY", summaryHeaderStyle);

            Row summaryHeaderRow = sheet.createRow(rowNum++);
            Cell metricHeader = summaryHeaderRow.createCell(0);
            metricHeader.setCellValue("Metric");
            metricHeader.setCellStyle(headerStyle);
            Cell countHeader = summaryHeaderRow.createCell(1);
            countHeader.setCellValue("Count");
            countHeader.setCellStyle(headerStyle);

            rowNum = writeTicketSummaryRow(sheet, rowNum, "Open", open, summaryLabelStyle, summaryValueStyle);
            rowNum = writeTicketSummaryRow(sheet, rowNum, "In Progress", inProgress, summaryLabelStyle, summaryValueStyle);
            rowNum = writeTicketSummaryRow(sheet, rowNum, "Resolved", resolved, summaryLabelStyle, summaryValueStyle);
            rowNum = writeTicketSummaryRow(sheet, rowNum, "Closed", closed, summaryLabelStyle, summaryValueStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1, 5);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export tickets", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportFlats(Long societyId) {
        List<Flat> flats;
        if (societyId != null) {
            flats = flatRepository.findBySocietyId(societyId);
        } else {
            flats = flatRepository.findAll();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Flats");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryValueStyle = createSummaryValueStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Flats Directory");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 8));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Flat Number", "Floor", "Type", "Area (sq ft)", "Owner Name", "Owner Phone",
                    "Owner Email", "Occupied" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowNum = 3;
            for (Flat f : flats) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(f.getId());
                row.createCell(1).setCellValue(f.getFlatNumber());
                row.createCell(2).setCellValue(f.getFloor() != null ? f.getFloor() : 0);
                row.createCell(3).setCellValue(f.getFlatType() != null ? f.getFlatType() : "");
                row.createCell(4).setCellValue(f.getArea() != null ? f.getArea().doubleValue() : 0);
                row.createCell(5).setCellValue(f.getOwnerName() != null ? f.getOwnerName() : "");
                row.createCell(6).setCellValue(f.getOwnerPhone() != null ? f.getOwnerPhone() : "");
                row.createCell(7).setCellValue(f.getOwnerEmail() != null ? f.getOwnerEmail() : "");
                row.createCell(8).setCellValue(f.getIsOccupied() != null && f.getIsOccupied() ? "Yes" : "No");
            }
            int dataEndRow = rowNum - 1;

            // Summary
            rowNum += 2;
            long occupied = flats.stream().filter(f -> f.getIsOccupied() != null && f.getIsOccupied()).count();
            rowNum = writeSummaryTitleRow(sheet, rowNum, 0, 1, "SUMMARY", summaryHeaderStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Total Flats", flats.size(), summaryLabelStyle, summaryValueStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Occupied", occupied, summaryLabelStyle, summaryValueStyle);
            rowNum = writeSummaryCountRow(sheet, rowNum, 0, "Vacant", flats.size() - occupied, summaryLabelStyle, summaryValueStyle);

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export flats", e);
        }
    }

    @Override
    public ByteArrayOutputStream exportFinancialReport(Long societyId, String reportType, String startDate,
            String endDate) {
        String normalizedType = reportType != null ? reportType.toUpperCase() : "MTD";
        FinancialReportResponse report;
        switch (normalizedType) {
            case "YTD":
                report = reportService.getYTDReport(societyId);
                break;
            case "CUSTOM":
                report = reportService.getCustomReport(societyId, LocalDate.parse(startDate), LocalDate.parse(endDate));
                break;
            case "COMPARISON":
                report = reportService.getComparisonReport(societyId, "MONTH");
                break;
            case "MTD":
            default:
                report = reportService.getMTDReport(societyId);
                normalizedType = "MTD";
                break;
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Financial Report");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle summaryHeaderStyle = createSummaryHeaderStyle(workbook);
            CellStyle summaryLabelStyle = createSummaryLabelStyle(workbook);
            CellStyle summaryValueStyle = createSummaryValueStyle(workbook);
            CellStyle summaryCurrencyStyle = createSummaryCurrencyValueStyle(workbook);

            // Title
            int rowNum = 0;
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(normalizedType + " Financial Report (" + report.getStartDate() + " to " + report.getEndDate() + ")");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            Row societyRow = sheet.createRow(rowNum++);
            societyRow.createCell(0).setCellValue("Society");
            societyRow.createCell(1).setCellValue(report.getSocietyName() != null ? report.getSocietyName() : "-");

            rowNum++;

            rowNum = writeSummaryTitleRow(sheet, rowNum, 0, 1, "SUMMARY", summaryHeaderStyle);

            String[] summaryLabels = { "Total Income", "Total Expense", "Net Balance", "Cash Balance" };
            BigDecimal[] summaryValues = {
                    safeAmount(report.getTotalIncome()),
                    safeAmount(report.getTotalExpense()),
                    safeAmount(report.getNetBalance()),
                    safeAmount(report.getCashBalance())
            };

            for (int i = 0; i < summaryLabels.length; i++) {
                rowNum = writeSummaryCurrencyRow(sheet, rowNum, 0, summaryLabels[i], summaryValues[i], summaryLabelStyle, summaryCurrencyStyle);
            }

            if ("COMPARISON".equals(normalizedType)) {
                Row previousIncome = sheet.createRow(rowNum++);
                previousIncome.createCell(0).setCellValue("Previous Period Income");
                Cell previousIncomeValue = previousIncome.createCell(1);
                previousIncomeValue.setCellValue(safeAmount(report.getPreviousPeriodIncome()).doubleValue());
                previousIncome.getCell(0).setCellStyle(summaryLabelStyle);
                previousIncomeValue.setCellStyle(summaryCurrencyStyle);

                Row previousExpense = sheet.createRow(rowNum++);
                previousExpense.createCell(0).setCellValue("Previous Period Expense");
                Cell previousExpenseValue = previousExpense.createCell(1);
                previousExpenseValue.setCellValue(safeAmount(report.getPreviousPeriodExpense()).doubleValue());
                previousExpense.getCell(0).setCellStyle(summaryLabelStyle);
                previousExpenseValue.setCellStyle(summaryCurrencyStyle);
            }

            rowNum += 2;
            rowNum = writeMapSection(sheet, rowNum, "INCOME BY CATEGORY", report.getIncomeByCategory(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "EXPENSE BY CATEGORY", report.getExpenseByCategory(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "INCOME BY PAYMENT MODE", report.getIncomeByPaymentMode(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "EXPENSE BY PAYMENT MODE", report.getExpenseByPaymentMode(), headerStyle, currencyStyle);

            if (!"COMPARISON".equals(normalizedType)) {
                Row billsHeader = sheet.createRow(rowNum++);
                billsHeader.createCell(0).setCellValue("BILLS SUMMARY");
                billsHeader.getCell(0).setCellStyle(summaryHeaderStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Total Bills", report.getTotalBillsGenerated(), summaryLabelStyle, summaryValueStyle);
                rowNum = writeNumberMetricRow(sheet, rowNum, "Paid Bills", report.getBillsPaid(), summaryLabelStyle, summaryValueStyle);
                rowNum = writeNumberMetricRow(sheet, rowNum, "Pending Bills", report.getBillsPending(), summaryLabelStyle, summaryValueStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Collected Amount", report.getBillsCollectedAmount(), summaryLabelStyle, summaryCurrencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Pending Amount", report.getBillsPendingAmount(), summaryLabelStyle, summaryCurrencyStyle);

                rowNum += 2;
                Row statsHeader = sheet.createRow(rowNum++);
                statsHeader.createCell(0).setCellValue("PERIOD STATISTICS");
                statsHeader.getCell(0).setCellStyle(summaryHeaderStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Transactions", report.getTransactionCount(), summaryLabelStyle, summaryValueStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Late Fees Collected", report.getLateFeeCollected(), summaryLabelStyle, summaryCurrencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Discounts Given", report.getDiscountGiven(), summaryLabelStyle, summaryCurrencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Tax Collected", report.getTaxCollected(), summaryLabelStyle, summaryCurrencyStyle);

                rowNum += 2;
                Row duesHeader = sheet.createRow(rowNum++);
                duesHeader.createCell(0).setCellValue("OUTSTANDING DUES");
                duesHeader.getCell(0).setCellStyle(summaryHeaderStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Unpaid / Partial Bills", report.getOutstandingDuesCount(), summaryLabelStyle, summaryValueStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Outstanding Dues Amount", report.getOutstandingDuesAmount(), summaryLabelStyle, summaryCurrencyStyle);

                rowNum += 2;
                Row upcomingHeader = sheet.createRow(rowNum++);
                upcomingHeader.createCell(0).setCellValue("UPCOMING PAYMENTS");
                upcomingHeader.getCell(0).setCellStyle(summaryHeaderStyle);

                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Upcoming Total", report.getUpcomingExpenses(), summaryLabelStyle, summaryCurrencyStyle);

                if (report.getUpcomingPayments() != null && !report.getUpcomingPayments().isEmpty()) {
                    Row upcomingTableHeader = sheet.createRow(rowNum++);
                    String[] headers = { "Description", "Type", "Due Date", "Amount" };
                    for (int i = 0; i < headers.length; i++) {
                        Cell cell = upcomingTableHeader.createCell(i);
                        cell.setCellValue(headers[i]);
                        cell.setCellStyle(headerStyle);
                    }

                    for (FinancialReportResponse.UpcomingPayment payment : report.getUpcomingPayments()) {
                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue(payment.getDescription() != null ? payment.getDescription() : "-");
                        row.createCell(1).setCellValue(prettyLabel(payment.getType()));
                        row.createCell(2).setCellValue(payment.getDueDate() != null ? formatExportDate(payment.getDueDate()) : "-");
                        Cell amountCell = row.createCell(3);
                        amountCell.setCellValue(safeAmount(payment.getAmount()).doubleValue());
                        amountCell.setCellStyle(currencyStyle);
                    }
                } else {
                    sheet.createRow(rowNum++).createCell(0).setCellValue("No upcoming payments in this period window");
                }
            }

            if (report.getMonthlyTrends() != null && !report.getMonthlyTrends().isEmpty()) {
                rowNum += 2;
                Row monthlyHeader = sheet.createRow(rowNum++);
                monthlyHeader.createCell(0).setCellValue("MONTHLY TRENDS");
                monthlyHeader.getCell(0).setCellStyle(headerStyle);

                Row monthlyTableHeader = sheet.createRow(rowNum++);
                String[] monthlyHeaders = { "Month", "Income", "Expense", "Balance" };
                for (int i = 0; i < monthlyHeaders.length; i++) {
                    Cell cell = monthlyTableHeader.createCell(i);
                    cell.setCellValue(monthlyHeaders[i]);
                    cell.setCellStyle(headerStyle);
                }

                for (FinancialReportResponse.MonthlyTrend trend : report.getMonthlyTrends()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(trend.getMonth() != null ? trend.getMonth() : "-");

                    Cell incomeCell = row.createCell(1);
                    incomeCell.setCellValue(safeAmount(trend.getIncome()).doubleValue());
                    incomeCell.setCellStyle(currencyStyle);

                    Cell expenseCell = row.createCell(2);
                    expenseCell.setCellValue(safeAmount(trend.getExpense()).doubleValue());
                    expenseCell.setCellStyle(currencyStyle);

                    Cell balanceCell = row.createCell(3);
                    balanceCell.setCellValue(safeAmount(trend.getBalance()).doubleValue());
                    balanceCell.setCellStyle(currencyStyle);
                }
            }

            if (report.getDailyTrends() != null && !report.getDailyTrends().isEmpty() && report.getDailyTrends().size() <= 31) {
                rowNum += 2;
                Row dailyHeader = sheet.createRow(rowNum++);
                dailyHeader.createCell(0).setCellValue("DAILY TRENDS");
                dailyHeader.getCell(0).setCellStyle(headerStyle);

                Row dailyTableHeader = sheet.createRow(rowNum++);
                String[] dailyHeaders = { "Date", "Income", "Expense", "Net" };
                for (int i = 0; i < dailyHeaders.length; i++) {
                    Cell cell = dailyTableHeader.createCell(i);
                    cell.setCellValue(dailyHeaders[i]);
                    cell.setCellStyle(headerStyle);
                }

                for (FinancialReportResponse.DailyTrend trend : report.getDailyTrends()) {
                    Row row = sheet.createRow(rowNum++);
                    BigDecimal income = safeAmount(trend.getIncome());
                    BigDecimal expense = safeAmount(trend.getExpense());
                    BigDecimal net = income.subtract(expense);

                    row.createCell(0).setCellValue(trend.getDate() != null ? formatExportDate(trend.getDate()) : "-");

                    Cell incomeCell = row.createCell(1);
                    incomeCell.setCellValue(income.doubleValue());
                    incomeCell.setCellStyle(currencyStyle);

                    Cell expenseCell = row.createCell(2);
                    expenseCell.setCellValue(expense.doubleValue());
                    expenseCell.setCellStyle(currencyStyle);

                    Cell netCell = row.createCell(3);
                    netCell.setCellValue(net.doubleValue());
                    netCell.setCellStyle(currencyStyle);
                }
            }

            applyCommonSheetStyling(sheet, 2, -1, -1, 1);

            autoSizeColumnsWithMinWidth(sheet, 8, 14);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export financial report", e);
        }
    }

    private int writeMapSection(Sheet sheet, int rowNum, String title, java.util.Map<String, BigDecimal> data,
            CellStyle headerStyle, CellStyle currencyStyle) {
        Row sectionHeader = sheet.createRow(rowNum++);
        sectionHeader.createCell(0).setCellValue(title);
        sectionHeader.getCell(0).setCellStyle(headerStyle);

        Row tableHeader = sheet.createRow(rowNum++);
        tableHeader.createCell(0).setCellValue("Label");
        tableHeader.createCell(1).setCellValue("Amount");
        tableHeader.getCell(0).setCellStyle(headerStyle);
        tableHeader.getCell(1).setCellStyle(headerStyle);

        if (data == null || data.isEmpty()) {
            sheet.createRow(rowNum++).createCell(0).setCellValue("No data");
            return rowNum + 1;
        }

        for (java.util.Map.Entry<String, BigDecimal> entry : data.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(prettyLabel(entry.getKey()));
            Cell amountCell = row.createCell(1);
            amountCell.setCellValue(safeAmount(entry.getValue()).doubleValue());
            amountCell.setCellStyle(currencyStyle);
        }
        return rowNum + 1;
    }

    private int writeNumberMetricRow(Sheet sheet, int rowNum, String label, Integer value,
            CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum++);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);

        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value != null ? value : 0);
        valueCell.setCellStyle(valueStyle);
        return rowNum;
    }

    private int writeCurrencyMetricRow(Sheet sheet, int rowNum, String label, BigDecimal value,
            CellStyle labelStyle, CellStyle currencyValueStyle) {
        Row row = sheet.createRow(rowNum++);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);

        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(safeAmount(value).doubleValue());
        valueCell.setCellStyle(currencyValueStyle);
        return rowNum;
    }

    private int writeSummaryTitleRow(Sheet sheet, int rowNum, int startColumn, int endColumn,
            String title, CellStyle headerStyle) {
        Row row = sheet.createRow(rowNum++);
        for (int col = startColumn; col <= endColumn; col++) {
            Cell cell = row.createCell(col);
            cell.setCellStyle(headerStyle);
            if (col == startColumn) {
                cell.setCellValue(title);
            }
        }
        sheet.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), startColumn, endColumn));
        return rowNum;
    }

    private int writeSummaryCountRow(Sheet sheet, int rowNum, int labelColumn, String label, long value,
            CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum++);
        Cell labelCell = row.createCell(labelColumn);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);

        Cell valueCell = row.createCell(labelColumn + 1);
        valueCell.setCellValue(value);
        valueCell.setCellStyle(valueStyle);
        return rowNum;
    }

    private int writeSummaryCurrencyRow(Sheet sheet, int rowNum, int labelColumn, String label, BigDecimal value,
            CellStyle labelStyle, CellStyle currencyValueStyle) {
        Row row = sheet.createRow(rowNum++);
        Cell labelCell = row.createCell(labelColumn);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);

        Cell valueCell = row.createCell(labelColumn + 1);
        valueCell.setCellValue(safeAmount(value).doubleValue());
        valueCell.setCellStyle(currencyValueStyle);
        return rowNum;
    }

    private void applyCommonSheetStyling(Sheet sheet, int headerRowIndex, int dataStartRow, int dataEndRow,
            int freezeColumnCount, int... statusColumns) {
        sheet.createFreezePane(Math.max(freezeColumnCount, 0), headerRowIndex + 1);
        sheet.setRepeatingRows(CellRangeAddress.valueOf("$1:$" + (headerRowIndex + 1)));
        sheet.setHorizontallyCenter(true);
        sheet.setFitToPage(true);
        sheet.setAutobreaks(true);

        PrintSetup printSetup = sheet.getPrintSetup();
        printSetup.setLandscape(true);
        printSetup.setFitWidth((short) 1);
        printSetup.setFitHeight((short) 0);

        if (dataStartRow >= 0 && dataEndRow >= dataStartRow) {
            applyDataBandingAndStatusHighlight(sheet, dataStartRow, dataEndRow, statusColumns);
        }
    }

    private void applyDataBandingAndStatusHighlight(Sheet sheet, int dataStartRow, int dataEndRow, int... statusColumns) {
        Workbook workbook = sheet.getWorkbook();
        DataFormatter formatter = new DataFormatter(Locale.ENGLISH);
        Map<String, CellStyle> styleCache = new HashMap<>();
        Map<Integer, Boolean> statusColumnLookup = new HashMap<>();
        for (int statusColumn : statusColumns) {
            statusColumnLookup.put(statusColumn, Boolean.TRUE);
        }

        for (int rowIndex = dataStartRow; rowIndex <= dataEndRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null || row.getLastCellNum() <= 0) {
                continue;
            }

            for (int columnIndex = 0; columnIndex < row.getLastCellNum(); columnIndex++) {
                Cell cell = row.getCell(columnIndex);
                if (cell == null) {
                    continue;
                }

                String normalizedText = formatter.formatCellValue(cell).trim().toUpperCase(Locale.ENGLISH);
                String variant;
                boolean isStatusColumn = Boolean.TRUE.equals(statusColumnLookup.get(columnIndex));
                if (isStatusColumn && (normalizedText.contains("OVERDUE") || normalizedText.contains("UNPAID")
                        || normalizedText.contains("PENDING") || normalizedText.contains("FAILED")
                        || normalizedText.contains("REJECTED"))) {
                    variant = "critical";
                } else if (isStatusColumn && (normalizedText.contains("PARTIAL")
                        || normalizedText.contains("IN_PROGRESS") || normalizedText.contains("PROCESSING"))) {
                    variant = "warning";
                } else if (isStatusColumn && (normalizedText.contains("PAID") || normalizedText.contains("SUCCESS")
                        || normalizedText.contains("COMPLETED") || normalizedText.contains("CLOSED")
                        || normalizedText.contains("RESOLVED") || normalizedText.contains("APPROVED")
                        || normalizedText.contains("ACTIVE"))) {
                    variant = "good";
                } else {
                    continue;
                }

                CellStyle baseStyle = cell.getCellStyle();
                String cacheKey = baseStyle.getIndex() + ":" + variant;
                CellStyle styledCell = styleCache.get(cacheKey);
                if (styledCell == null) {
                    styledCell = workbook.createCellStyle();
                    styledCell.cloneStyleFrom(baseStyle);

                    Font baseFont = workbook.getFontAt(baseStyle.getFontIndex());
                    Font font = workbook.createFont();
                    font.setBold(baseFont.getBold());
                    font.setFontHeight(baseFont.getFontHeight());
                    font.setFontName(baseFont.getFontName());
                    font.setItalic(baseFont.getItalic());
                    font.setUnderline(baseFont.getUnderline());
                    font.setColor(baseFont.getColor());

                    if ("critical".equals(variant)) {
                        applyFillColor(styledCell, new byte[] { (byte) 255, (byte) 0, (byte) 0 }, IndexedColors.RED);
                    } else if ("warning".equals(variant)) {
                        applyFillColor(styledCell, new byte[] { (byte) 80, (byte) 180, (byte) 220 }, IndexedColors.LIGHT_CORNFLOWER_BLUE);
                    } else if ("good".equals(variant)) {
                        applyFillColor(styledCell, new byte[] { (byte) 92, (byte) 214, (byte) 92 }, IndexedColors.BRIGHT_GREEN);
                    }

                    font.setBold(true);
                    font.setColor(IndexedColors.BLACK.getIndex());

                    styledCell.setFont(font);
                    styleCache.put(cacheKey, styledCell);
                }

                cell.setCellStyle(styledCell);
            }
        }
    }

    private void applyFillColor(CellStyle style, byte[] rgbColor, IndexedColors fallback) {
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        if (style instanceof XSSFCellStyle xssfStyle) {
            xssfStyle.setFillForegroundColor(new XSSFColor(rgbColor, new DefaultIndexedColorMap()));
        } else {
            style.setFillForegroundColor(fallback.getIndex());
        }
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String prettyLabel(String value) {
        if (value == null || value.isBlank()) {
            return "OTHER";
        }
        String[] words = value.replace('-', '_').split("_");
        StringBuilder builder = new StringBuilder();
        for (String word : words) {
            if (word == null || word.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append(' ');
            }
            String lower = word.toLowerCase();
            builder.append(Character.toUpperCase(lower.charAt(0))).append(lower.substring(1));
        }
        return builder.length() > 0 ? builder.toString() : "OTHER";
    }

    private String resolveTransactionReference(Transaction transaction) {
        if (transaction.getReferenceNumber() != null && !transaction.getReferenceNumber().isBlank()) {
            return transaction.getReferenceNumber();
        }
        return "CASH".equals(transaction.getPaymentMode()) ? "N/A - Cash payment" : "Missing";
    }

    private String resolveTransactionCheque(Transaction transaction) {
        if (transaction.getChequeNumber() != null && !transaction.getChequeNumber().isBlank()) {
            return transaction.getChequeNumber();
        }
        return "CHEQUE".equals(transaction.getPaymentMode()) ? "Missing" : "N/A - Not a cheque payment";
    }

    private String resolveTransactionBankName(Transaction transaction) {
        if (transaction.getBankName() != null && !transaction.getBankName().isBlank()) {
            return transaction.getBankName();
        }
        return ("CASH".equals(transaction.getPaymentMode()) || "UPI".equals(transaction.getPaymentMode()) || "WALLET".equals(transaction.getPaymentMode()))
                ? "N/A"
                : "Missing";
    }

    private String resolveTransactionUpiId(Transaction transaction) {
        if (transaction.getUpiId() != null && !transaction.getUpiId().isBlank()) {
            return transaction.getUpiId();
        }
        return "UPI".equals(transaction.getPaymentMode()) ? "Missing" : "N/A";
    }

    private String resolveTransactionUtr(Transaction transaction) {
        if (transaction.getUtrNumber() != null && !transaction.getUtrNumber().isBlank()) {
            return transaction.getUtrNumber();
        }
        return ("CASH".equals(transaction.getPaymentMode()) || "CHEQUE".equals(transaction.getPaymentMode()))
                ? "N/A"
                : "Missing";
    }

    private String resolveTransactionCardType(Transaction transaction) {
        if (transaction.getCardType() != null && !transaction.getCardType().isBlank()) {
            return transaction.getCardType();
        }
        return ("CREDIT_CARD".equals(transaction.getPaymentMode()) || "DEBIT_CARD".equals(transaction.getPaymentMode()))
                ? "Missing"
                : "N/A";
    }

    private String resolveTransactionCardLastFour(Transaction transaction) {
        if (transaction.getCardLastFourDigits() != null && !transaction.getCardLastFourDigits().isBlank()) {
            return transaction.getCardLastFourDigits();
        }
        return ("CREDIT_CARD".equals(transaction.getPaymentMode()) || "DEBIT_CARD".equals(transaction.getPaymentMode()))
                ? "Missing"
                : "N/A";
    }

    private String resolveTransactionPaymentMonth(Transaction transaction) {
        if (transaction.getPaymentMonth() != null && !transaction.getPaymentMonth().isBlank()) {
            return formatExportMonth(transaction.getPaymentMonth());
        }
        return "MAINTENANCE".equals(transaction.getCategory()) ? "Missing" : "N/A";
    }

    @Override
    public ByteArrayOutputStream exportPayments(Long societyId, Long userId) {
        List<Payment> payments;
        if (societyId != null) {
            payments = paymentRepository.findBySocietyIdAndDeletedAtIsNullOrderByCreatedAtDesc(societyId);
        } else if (userId != null) {
            payments = paymentRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
        } else {
            payments = List.of();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payments");
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Online Payments Report");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            Row headerRow = sheet.createRow(2);
            String[] headers = {
                    "ID", "Payment ID", "Order ID", "User", "Society", "Amount", "Currency", "Status", "Method",
                    "Payment Type", "Receipt", "Refund Status", "Refund Amount", "Settlement", "UTR", "Created At", "Paid At"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 3;
            for (Payment p : payments) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getId() != null ? p.getId() : 0L);
                row.createCell(1).setCellValue(p.getRazorpayPaymentId() != null ? p.getRazorpayPaymentId() : "");
                row.createCell(2).setCellValue(p.getRazorpayOrderId() != null ? p.getRazorpayOrderId() : "");
                row.createCell(3).setCellValue(p.getUser() != null && p.getUser().getName() != null ? p.getUser().getName() : "");
                row.createCell(4).setCellValue(p.getSociety() != null && p.getSociety().getName() != null ? p.getSociety().getName() : "");

                Cell amountCell = row.createCell(5);
                amountCell.setCellValue(p.getAmount() != null ? p.getAmount().doubleValue() : 0d);
                amountCell.setCellStyle(currencyStyle);

                row.createCell(6).setCellValue(p.getCurrency() != null ? p.getCurrency() : "");
                row.createCell(7).setCellValue(p.getStatus() != null ? p.getStatus() : "");
                row.createCell(8).setCellValue(p.getPaymentMethod() != null ? p.getPaymentMethod() : "");
                row.createCell(9).setCellValue(p.getPaymentType() != null ? p.getPaymentType() : "");
                row.createCell(10).setCellValue(p.getReceiptNumber() != null ? p.getReceiptNumber() : "");
                row.createCell(11).setCellValue(p.getRefundStatus() != null ? p.getRefundStatus() : "NONE");

                Cell refundAmountCell = row.createCell(12);
                refundAmountCell.setCellValue(p.getRefundAmount() != null ? p.getRefundAmount().doubleValue() : 0d);
                refundAmountCell.setCellStyle(currencyStyle);

                row.createCell(13).setCellValue(p.getSettlementStatus() != null ? p.getSettlementStatus() : "NONE");
                row.createCell(14).setCellValue(p.getSettlementUtr() != null ? p.getSettlementUtr() : "");
                row.createCell(15).setCellValue(formatExportDateTime(p.getCreatedAt()));
                row.createCell(16).setCellValue(formatExportDateTime(p.getPaidAt()));
            }
            int dataEndRow = rowNum - 1;

            applyCommonSheetStyling(sheet, 2, 3, dataEndRow, 1, 7, 11, 13);

            autoSizeColumnsWithMinWidth(sheet, 17, 12);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export payments", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(false);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createSummaryHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createSummaryLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createSummaryValueStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createSummaryCurrencyValueStyle(Workbook workbook) {
        CellStyle style = createSummaryValueStyle(workbook);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private int writeTicketSummaryRow(Sheet sheet, int rowNum, String metric, long count,
                                      CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum++);
        Cell metricCell = row.createCell(0);
        metricCell.setCellValue(metric);
        metricCell.setCellStyle(labelStyle);
        Cell countCell = row.createCell(1);
        countCell.setCellValue(count);
        countCell.setCellStyle(valueStyle);
        return rowNum;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("yyyy-mm-dd"));
        return style;
    }

    private String formatExportDate(LocalDate value) {
        return value != null ? value.format(EXPORT_DATE_FORMAT) : "";
    }

    private String formatExportDateTime(LocalDateTime value) {
        return value != null ? value.format(EXPORT_DATE_TIME_FORMAT) : "";
    }

    private String formatExportMonth(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value.trim();
        DateTimeFormatter[] supportedPatterns = new DateTimeFormatter[] {
                DateTimeFormatter.ofPattern("yyyy-MM", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MM/yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("yyyy/MM", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH)
        };

        for (DateTimeFormatter pattern : supportedPatterns) {
            try {
                return YearMonth.parse(normalized, pattern).format(EXPORT_MONTH_FORMAT);
            } catch (DateTimeParseException ignored) {
                // try next pattern
            }
        }

        return normalized;
    }

    private int countNonEmptyCells(Row row, int columnCount, DataFormatter formatter) {
        int count = 0;
        for (int i = 0; i < columnCount; i++) {
            Cell cell = row.getCell(i);
            if (cell == null) {
                continue;
            }
            String value = formatter.formatCellValue(cell);
            if (value != null && !value.trim().isEmpty()) {
                count++;
            }
        }
        return count;
    }

    private void autoSizeColumnsWithMinWidth(Sheet sheet, int columnCount, int minCharWidth) {
        int minWidthChars = Math.max(minCharWidth, 1);
        int maxWidthChars = 80;
        int paddingChars = 3;
        DataFormatter formatter = new DataFormatter(Locale.ENGLISH);
        Workbook workbook = sheet.getWorkbook();
        Map<Short, CellStyle> centeredStyleCache = new HashMap<>();

        for (int i = 0; i < columnCount; i++) {
            int longestTextChars = 0;

            for (Row row : sheet) {
                if (row.getRowNum() == 0) {
                    continue; // Skip merged title row so table columns aren't distorted.
                }

                int nonEmptyCells = countNonEmptyCells(row, columnCount, formatter);
                if (nonEmptyCells > 0 && nonEmptyCells < 3) {
                    continue; // Skip summary/sparse rows when sizing table columns.
                }

                Cell cell = row.getCell(i);
                if (cell == null) {
                    continue;
                }

                // Center-align all export cells while preserving existing borders/fills/formats.
                CellStyle baseStyle = cell.getCellStyle();
                short styleIndex = baseStyle.getIndex();
                CellStyle centeredStyle = centeredStyleCache.get(styleIndex);
                if (centeredStyle == null) {
                    centeredStyle = workbook.createCellStyle();
                    centeredStyle.cloneStyleFrom(baseStyle);
                    centeredStyle.setAlignment(HorizontalAlignment.CENTER);
                    centeredStyle.setVerticalAlignment(VerticalAlignment.CENTER);
                    centeredStyleCache.put(styleIndex, centeredStyle);
                }
                cell.setCellStyle(centeredStyle);

                String displayText = formatter.formatCellValue(cell);
                if (displayText != null) {
                    int effectiveLength = displayText.trim().length();
                    if (effectiveLength > longestTextChars) {
                        longestTextChars = effectiveLength;
                    }
                }
            }

            int desiredChars = Math.max(longestTextChars + paddingChars, minWidthChars);
            desiredChars = Math.min(desiredChars, maxWidthChars);
            sheet.setColumnWidth(i, desiredChars * 256);
        }
    }
}
