package com.society.backend.service.report;

import com.society.backend.dto.report.FinancialReportResponse;

import java.time.LocalDate;

public interface ReportService {

    /**
     * Get Month-to-Date financial report
     */
    FinancialReportResponse getMTDReport(Long societyId);

    /**
     * Get Year-to-Date financial report
     */
    FinancialReportResponse getYTDReport(Long societyId);

    /**
     * Get custom date range financial report
     */
    FinancialReportResponse getCustomReport(Long societyId, LocalDate startDate, LocalDate endDate);

    /**
     * Get financial summary for dashboard (quick overview)
     */
    FinancialReportResponse getDashboardSummary(Long societyId);

    /**
     * Get comparison report (current period vs previous period)
     */
    FinancialReportResponse getComparisonReport(Long societyId, String periodType);
}
