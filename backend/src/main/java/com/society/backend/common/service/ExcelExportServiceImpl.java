package com.society.backend.common.service;

import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.finance.dto.response.FinancialReportResponse;
import com.society.backend.finance.service.ReportService;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.finance.repository.TransactionRepository;
import com.society.backend.vendor.repository.VendorBillRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

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

    private final TransactionRepository transactionRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final VendorBillRepository vendorBillRepository;
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
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);

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
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
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
                dateCell.setCellValue(t.getTransactionDate().toString());
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

            // Summary section
            rowNum += 2;
            Row summaryRow1 = sheet.createRow(rowNum++);
            summaryRow1.createCell(4).setCellValue("Total Income:");
            Cell incomeCell = summaryRow1.createCell(5);
            incomeCell.setCellValue(totalIncome.doubleValue());
            incomeCell.setCellStyle(currencyStyle);

            Row summaryRow2 = sheet.createRow(rowNum++);
            summaryRow2.createCell(4).setCellValue("Total Expense:");
            Cell expenseCell = summaryRow2.createCell(5);
            expenseCell.setCellValue(totalExpense.doubleValue());
            expenseCell.setCellStyle(currencyStyle);

            Row summaryRow3 = sheet.createRow(rowNum++);
            summaryRow3.createCell(4).setCellValue("Net Balance:");
            Cell netCell = summaryRow3.createCell(5);
            netCell.setCellValue(totalIncome.subtract(totalExpense).doubleValue());
            netCell.setCellStyle(currencyStyle);

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

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Maintenance Bills");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Maintenance Bills Report" + (month != null ? " - " + month : ""));
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 8));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Flat", "Society", "Month", "Amount", "Paid Amount", "Due Date", "Status",
                    "Payment Mode" };
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
                row.createCell(3).setCellValue(b.getBillMonth());

                Cell amountCell = row.createCell(4);
                amountCell.setCellValue(b.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                Cell paidCell = row.createCell(5);
                paidCell.setCellValue(b.getPaidAmount() != null ? b.getPaidAmount().doubleValue() : 0);
                paidCell.setCellStyle(currencyStyle);

                row.createCell(6).setCellValue(b.getDueDate() != null ? b.getDueDate().toString() : "");
                row.createCell(7).setCellValue(b.getStatus());
                row.createCell(8).setCellValue(b.getPaymentMode() != null ? b.getPaymentMode() : "");

                totalAmount = totalAmount.add(b.getAmount());
                if (b.getPaidAmount() != null) {
                    totalPaid = totalPaid.add(b.getPaidAmount());
                }
            }

            // Summary
            rowNum += 2;
            Row summaryRow1 = sheet.createRow(rowNum++);
            summaryRow1.createCell(3).setCellValue("Total Bills:");
            summaryRow1.createCell(4).setCellValue(bills.size());

            Row summaryRow2 = sheet.createRow(rowNum++);
            summaryRow2.createCell(3).setCellValue("Total Amount:");
            Cell totalAmountCell = summaryRow2.createCell(4);
            totalAmountCell.setCellValue(totalAmount.doubleValue());
            totalAmountCell.setCellStyle(currencyStyle);

            Row summaryRow3 = sheet.createRow(rowNum++);
            summaryRow3.createCell(3).setCellValue("Total Collected:");
            Cell totalCollectedCell = summaryRow3.createCell(4);
            totalCollectedCell.setCellValue(totalPaid.doubleValue());
            totalCollectedCell.setCellStyle(currencyStyle);

            Row summaryRow4 = sheet.createRow(rowNum++);
            summaryRow4.createCell(3).setCellValue("Pending:");
            Cell pendingCell = summaryRow4.createCell(4);
            pendingCell.setCellValue(totalAmount.subtract(totalPaid).doubleValue());
            pendingCell.setCellStyle(currencyStyle);

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

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Vendor Bills Report");
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Bill Number", "Vendor", "Bill Date", "Due Date", "Amount", "Paid", "Status",
                    "Overdue Days", "Description" };
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
                row.createCell(3).setCellValue(b.getBillDate().toString());
                row.createCell(4).setCellValue(b.getDueDate() != null ? b.getDueDate().toString() : "");

                Cell amountCell = row.createCell(5);
                amountCell.setCellValue(b.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                Cell paidCell = row.createCell(6);
                paidCell.setCellValue(b.getPaidAmount() != null ? b.getPaidAmount().doubleValue() : 0);
                paidCell.setCellStyle(currencyStyle);

                row.createCell(7).setCellValue(b.getStatus());
                row.createCell(8).setCellValue(b.getPendingDays());
                row.createCell(9).setCellValue(b.getDescription() != null ? b.getDescription() : "");

                totalAmount = totalAmount.add(b.getAmount());
                if (b.getPaidAmount() != null) {
                    totalPaid = totalPaid.add(b.getPaidAmount());
                }
            }

            // Summary
            rowNum += 2;
            Row summaryRow = sheet.createRow(rowNum++);
            summaryRow.createCell(4).setCellValue("Total Amount:");
            Cell totalCell = summaryRow.createCell(5);
            totalCell.setCellValue(totalAmount.doubleValue());
            totalCell.setCellStyle(currencyStyle);

            Row summaryRow2 = sheet.createRow(rowNum++);
            summaryRow2.createCell(4).setCellValue("Total Paid:");
            Cell paidTotalCell = summaryRow2.createCell(5);
            paidTotalCell.setCellValue(totalPaid.doubleValue());
            paidTotalCell.setCellStyle(currencyStyle);

            Row summaryRow3 = sheet.createRow(rowNum++);
            summaryRow3.createCell(4).setCellValue("Pending:");
            Cell pendingCell = summaryRow3.createCell(5);
            pendingCell.setCellValue(totalAmount.subtract(totalPaid).doubleValue());
            pendingCell.setCellStyle(currencyStyle);

            autoSizeColumnsWithMinWidth(sheet, headers.length, 12);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export vendor bills", e);
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

            CellStyle headerStyle = createHeaderStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Tickets Report");
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            // Headers
            Row headerRow = sheet.createRow(2);
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
                row.createCell(12).setCellValue(t.getLastReplyAt() != null ? t.getLastReplyAt().toString() : "");
                row.createCell(13).setCellValue(Boolean.TRUE.equals(t.getIsOverdue()) ? "Yes" : "No");
                row.createCell(14).setCellValue(t.getOverdueDays() != null ? t.getOverdueDays() : 0);
                row.createCell(15).setCellValue(t.getEscalationLevel() != null ? t.getEscalationLevel() : 0);
                row.createCell(16).setCellValue(t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
            }

            // Summary
            rowNum += 2;
            long open = tickets.stream().filter(t -> "OPEN".equals(t.getStatus())).count();
            long inProgress = tickets.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
            long resolved = tickets.stream().filter(t -> "RESOLVED".equals(t.getStatus())).count();
            long closed = tickets.stream().filter(t -> "CLOSED".equals(t.getStatus())).count();

            sheet.createRow(rowNum++).createCell(0).setCellValue("Summary:");
            sheet.createRow(rowNum).createCell(0).setCellValue("Open: " + open);
            sheet.getRow(rowNum++).createCell(2).setCellValue("In Progress: " + inProgress);
            sheet.createRow(rowNum).createCell(0).setCellValue("Resolved: " + resolved);
            sheet.getRow(rowNum++).createCell(2).setCellValue("Closed: " + closed);

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

            CellStyle headerStyle = createHeaderStyle(workbook);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Flats Directory");
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

            // Summary
            rowNum += 2;
            long occupied = flats.stream().filter(f -> f.getIsOccupied() != null && f.getIsOccupied()).count();
            sheet.createRow(rowNum++).createCell(0).setCellValue("Total Flats: " + flats.size());
            sheet.createRow(rowNum++).createCell(0).setCellValue("Occupied: " + occupied);
            sheet.createRow(rowNum++).createCell(0).setCellValue("Vacant: " + (flats.size() - occupied));

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

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

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

            Row summaryHeader = sheet.createRow(rowNum++);
            summaryHeader.createCell(0).setCellValue("SUMMARY");
            summaryHeader.getCell(0).setCellStyle(headerStyle);

            String[] summaryLabels = { "Total Income", "Total Expense", "Net Balance", "Cash Balance" };
            BigDecimal[] summaryValues = {
                    safeAmount(report.getTotalIncome()),
                    safeAmount(report.getTotalExpense()),
                    safeAmount(report.getNetBalance()),
                    safeAmount(report.getCashBalance())
            };

            for (int i = 0; i < summaryLabels.length; i++) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(summaryLabels[i]);
                Cell valueCell = row.createCell(1);
                valueCell.setCellValue(summaryValues[i].doubleValue());
                valueCell.setCellStyle(currencyStyle);
            }

            if ("COMPARISON".equals(normalizedType)) {
                Row previousIncome = sheet.createRow(rowNum++);
                previousIncome.createCell(0).setCellValue("Previous Period Income");
                Cell previousIncomeValue = previousIncome.createCell(1);
                previousIncomeValue.setCellValue(safeAmount(report.getPreviousPeriodIncome()).doubleValue());
                previousIncomeValue.setCellStyle(currencyStyle);

                Row previousExpense = sheet.createRow(rowNum++);
                previousExpense.createCell(0).setCellValue("Previous Period Expense");
                Cell previousExpenseValue = previousExpense.createCell(1);
                previousExpenseValue.setCellValue(safeAmount(report.getPreviousPeriodExpense()).doubleValue());
                previousExpenseValue.setCellStyle(currencyStyle);
            }

            rowNum += 2;
            rowNum = writeMapSection(sheet, rowNum, "INCOME BY CATEGORY", report.getIncomeByCategory(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "EXPENSE BY CATEGORY", report.getExpenseByCategory(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "INCOME BY PAYMENT MODE", report.getIncomeByPaymentMode(), headerStyle, currencyStyle);
            rowNum = writeMapSection(sheet, rowNum, "EXPENSE BY PAYMENT MODE", report.getExpenseByPaymentMode(), headerStyle, currencyStyle);

            if (!"COMPARISON".equals(normalizedType)) {
                Row billsHeader = sheet.createRow(rowNum++);
                billsHeader.createCell(0).setCellValue("BILLS SUMMARY");
                billsHeader.getCell(0).setCellStyle(headerStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Total Bills", report.getTotalBillsGenerated());
                rowNum = writeNumberMetricRow(sheet, rowNum, "Paid Bills", report.getBillsPaid());
                rowNum = writeNumberMetricRow(sheet, rowNum, "Pending Bills", report.getBillsPending());
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Collected Amount", report.getBillsCollectedAmount(), currencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Pending Amount", report.getBillsPendingAmount(), currencyStyle);

                rowNum += 2;
                Row statsHeader = sheet.createRow(rowNum++);
                statsHeader.createCell(0).setCellValue("PERIOD STATISTICS");
                statsHeader.getCell(0).setCellStyle(headerStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Transactions", report.getTransactionCount());
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Late Fees Collected", report.getLateFeeCollected(), currencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Discounts Given", report.getDiscountGiven(), currencyStyle);
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Tax Collected", report.getTaxCollected(), currencyStyle);

                rowNum += 2;
                Row duesHeader = sheet.createRow(rowNum++);
                duesHeader.createCell(0).setCellValue("OUTSTANDING DUES");
                duesHeader.getCell(0).setCellStyle(headerStyle);

                rowNum = writeNumberMetricRow(sheet, rowNum, "Unpaid / Partial Bills", report.getOutstandingDuesCount());
                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Outstanding Dues Amount", report.getOutstandingDuesAmount(), currencyStyle);

                rowNum += 2;
                Row upcomingHeader = sheet.createRow(rowNum++);
                upcomingHeader.createCell(0).setCellValue("UPCOMING PAYMENTS");
                upcomingHeader.getCell(0).setCellStyle(headerStyle);

                rowNum = writeCurrencyMetricRow(sheet, rowNum, "Upcoming Total", report.getUpcomingExpenses(), currencyStyle);

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
                        row.createCell(2).setCellValue(payment.getDueDate() != null ? payment.getDueDate().toString() : "-");
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

                    row.createCell(0).setCellValue(trend.getDate() != null ? trend.getDate().toString() : "-");

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

    private int writeNumberMetricRow(Sheet sheet, int rowNum, String label, Integer value) {
        Row row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue(label);
        row.createCell(1).setCellValue(value != null ? value : 0);
        return rowNum;
    }

    private int writeCurrencyMetricRow(Sheet sheet, int rowNum, String label, BigDecimal value, CellStyle currencyStyle) {
        Row row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue(label);
        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(safeAmount(value).doubleValue());
        valueCell.setCellStyle(currencyStyle);
        return rowNum;
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

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
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

    private void autoSizeColumnsWithMinWidth(Sheet sheet, int columnCount, int minCharWidth) {
        int minWidth = minCharWidth * 256;
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            if (sheet.getColumnWidth(i) < minWidth) {
                sheet.setColumnWidth(i, minWidth);
            }
        }
    }
}
