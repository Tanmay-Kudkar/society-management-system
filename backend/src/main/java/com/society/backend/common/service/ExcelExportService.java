package com.society.backend.common.service;

import java.io.ByteArrayOutputStream;
import java.util.List;

import com.society.backend.vendor.entity.Vendor;
public interface ExcelExportService {

    /**
     * Export transactions to Excel
     */
    ByteArrayOutputStream exportTransactions(Long societyId, String startDate, String endDate);

    /**
     * Export transactions to CSV
     */
    ByteArrayOutputStream exportTransactionsCsv(Long societyId, String startDate, String endDate);

    /**
     * Export maintenance bills to Excel
     */
    ByteArrayOutputStream exportMaintenanceBills(Long societyId, String month);

    /**
     * Export maintenance bills to CSV
     */
    ByteArrayOutputStream exportMaintenanceBillsCsv(Long societyId, String month);

    /**
     * Export vendor bills to Excel
     */
    ByteArrayOutputStream exportVendorBills(Long societyId, String startDate, String endDate);

    /**
     * Export vendor bills to CSV
     */
    ByteArrayOutputStream exportVendorBillsCsv(Long societyId, String startDate, String endDate);

    /**
     * Export tickets to Excel
     */
    ByteArrayOutputStream exportTickets(Long societyId, String status);

    /**
     * Export tickets to CSV
     */
    ByteArrayOutputStream exportTicketsCsv(Long societyId, String status);

    /**
     * Export flats with residents to Excel
     */
    ByteArrayOutputStream exportFlats(Long societyId);

    /**
     * Export flats with residents to CSV
     */
    ByteArrayOutputStream exportFlatsCsv(Long societyId);

    /**
     * Export financial report to Excel
     */
    ByteArrayOutputStream exportFinancialReport(Long societyId, String reportType, String startDate, String endDate);

    /**
     * Export financial report to CSV
     */
    ByteArrayOutputStream exportFinancialReportCsv(Long societyId, String reportType, String startDate, String endDate);

    /**
     * Export online payments to Excel
     */
    ByteArrayOutputStream exportPayments(Long societyId, Long userId);

    /**
     * Export online payments to CSV
     */
    ByteArrayOutputStream exportPaymentsCsv(Long societyId, Long userId);
}

