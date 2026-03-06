package com.society.backend.file.service;

import com.society.backend.entity.*;
import com.society.backend.flat.repository.FlatRepository;
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

@Service
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExcelExportService {

    private final TransactionRepository transactionRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final VendorBillRepository vendorBillRepository;
    private final TicketRepository ticketRepository;
    private final FlatRepository flatRepository;

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
            titleCell.setCellValue("Transaction Report (" + startDate + " to " + endDate + ")");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Date", "Type", "Category", "Payment Mode", "Amount", "Reference",
                    "Description" };
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
                row.createCell(4).setCellValue(t.getPaymentMode());

                Cell amountCell = row.createCell(5);
                amountCell.setCellValue(t.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);

                row.createCell(6).setCellValue(t.getReferenceNumber() != null ? t.getReferenceNumber() : "");
                row.createCell(7).setCellValue(t.getDescription() != null ? t.getDescription() : "");

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
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));

            // Headers
            Row headerRow = sheet.createRow(2);
            String[] headers = { "ID", "Title", "Type", "Priority", "Status", "Progress %", "Pending Days",
                    "Assigned To", "Created At", "Society" };
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
                row.createCell(1).setCellValue(t.getTitle());
                row.createCell(2).setCellValue(t.getType());
                row.createCell(3).setCellValue(t.getPriority());
                row.createCell(4).setCellValue(t.getStatus());
                row.createCell(5).setCellValue(t.getProgressPercent() != null ? t.getProgressPercent() : 0);
                row.createCell(6).setCellValue(t.getPendingDays());
                row.createCell(7).setCellValue(t.getAssignedTo() != null ? t.getAssignedTo().getName() : "Unassigned");
                row.createCell(8).setCellValue(t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
                row.createCell(9).setCellValue(t.getSociety().getName());
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
        LocalDate start;
        LocalDate end = LocalDate.now();

        switch (reportType.toUpperCase()) {
            case "MTD":
                start = YearMonth.now().atDay(1);
                break;
            case "YTD":
                start = LocalDate.now().withDayOfYear(1);
                break;
            case "CUSTOM":
                start = LocalDate.parse(startDate);
                end = LocalDate.parse(endDate);
                break;
            default:
                start = YearMonth.now().atDay(1);
        }

        List<Transaction> transactions = transactionRepository.findBySocietyIdAndTransactionDateBetween(societyId,
                start, end);

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
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(reportType.toUpperCase() + " Financial Report (" + start + " to " + end + ")");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Income Section
            int rowNum = 3;
            Row incomeHeader = sheet.createRow(rowNum++);
            incomeHeader.createCell(0).setCellValue("INCOME");
            incomeHeader.getCell(0).setCellStyle(headerStyle);

            Row incomeTableHeader = sheet.createRow(rowNum++);
            incomeTableHeader.createCell(0).setCellValue("Category");
            incomeTableHeader.createCell(1).setCellValue("Amount");
            incomeTableHeader.getCell(0).setCellStyle(headerStyle);
            incomeTableHeader.getCell(1).setCellStyle(headerStyle);

            BigDecimal totalIncome = BigDecimal.ZERO;
            var incomeByCategory = transactions.stream()
                    .filter(t -> "INCOME".equals(t.getTransactionType()))
                    .collect(java.util.stream.Collectors.groupingBy(
                            Transaction::getCategory,
                            java.util.stream.Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount,
                                    BigDecimal::add)));

            for (var entry : incomeByCategory.entrySet()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(entry.getKey());
                Cell amountCell = row.createCell(1);
                amountCell.setCellValue(entry.getValue().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                totalIncome = totalIncome.add(entry.getValue());
            }

            Row totalIncomeRow = sheet.createRow(rowNum++);
            totalIncomeRow.createCell(0).setCellValue("Total Income");
            Cell totalIncomeCell = totalIncomeRow.createCell(1);
            totalIncomeCell.setCellValue(totalIncome.doubleValue());
            totalIncomeCell.setCellStyle(currencyStyle);

            // Expense Section
            rowNum += 2;
            Row expenseHeader = sheet.createRow(rowNum++);
            expenseHeader.createCell(0).setCellValue("EXPENSE");
            expenseHeader.getCell(0).setCellStyle(headerStyle);

            Row expenseTableHeader = sheet.createRow(rowNum++);
            expenseTableHeader.createCell(0).setCellValue("Category");
            expenseTableHeader.createCell(1).setCellValue("Amount");
            expenseTableHeader.getCell(0).setCellStyle(headerStyle);
            expenseTableHeader.getCell(1).setCellStyle(headerStyle);

            BigDecimal totalExpense = BigDecimal.ZERO;
            var expenseByCategory = transactions.stream()
                    .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                    .collect(java.util.stream.Collectors.groupingBy(
                            Transaction::getCategory,
                            java.util.stream.Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount,
                                    BigDecimal::add)));

            for (var entry : expenseByCategory.entrySet()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(entry.getKey());
                Cell amountCell = row.createCell(1);
                amountCell.setCellValue(entry.getValue().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                totalExpense = totalExpense.add(entry.getValue());
            }

            Row totalExpenseRow = sheet.createRow(rowNum++);
            totalExpenseRow.createCell(0).setCellValue("Total Expense");
            Cell totalExpenseCell = totalExpenseRow.createCell(1);
            totalExpenseCell.setCellValue(totalExpense.doubleValue());
            totalExpenseCell.setCellStyle(currencyStyle);

            // Net Balance
            rowNum += 2;
            Row netRow = sheet.createRow(rowNum++);
            netRow.createCell(0).setCellValue("NET BALANCE");
            netRow.getCell(0).setCellStyle(headerStyle);
            Cell netCell = netRow.createCell(1);
            netCell.setCellValue(totalIncome.subtract(totalExpense).doubleValue());
            netCell.setCellStyle(currencyStyle);

            // Auto-size columns with minimum width
            autoSizeColumnsWithMinWidth(sheet, 2, 20);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException e) {
            throw new RuntimeException("Failed to export financial report", e);
        }
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
