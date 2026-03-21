package com.society.backend.common.service;

import java.io.ByteArrayOutputStream;
public interface ExcelExportService {

    /**
     * Export transactions to Excel
     */
    ByteArrayOutputStream exportTransactions(Long societyId, String startDate, String endDate);

    /**
     * Export maintenance bills to Excel
     */
    ByteArrayOutputStream exportMaintenanceBills(Long societyId, String month);

    /**
     * Export vendor bills to Excel
     */
    ByteArrayOutputStream exportVendorBills(Long societyId, String startDate, String endDate);

    /**
     * Export tickets to Excel
     */
    ByteArrayOutputStream exportTickets(Long societyId, String status);

    /**
     * Export flats with residents to Excel
     */
    ByteArrayOutputStream exportFlats(Long societyId);

    /**
     * Export financial report to Excel
     */
    ByteArrayOutputStream exportFinancialReport(Long societyId, String reportType, String startDate, String endDate);

    /**
     * Export online payments to Excel
     */
    ByteArrayOutputStream exportPayments(Long societyId, Long userId);

}

