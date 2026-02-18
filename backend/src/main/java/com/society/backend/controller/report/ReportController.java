package com.society.backend.controller.report;

import com.society.backend.dto.report.FinancialReportResponse;
import com.society.backend.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Get Month-to-Date financial report
     * Only accessible by MASTER_ADMIN, SOCIETY_ADMIN, and Committee Level roles
     */
    @GetMapping("/mtd/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<FinancialReportResponse> getMTDReport(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getMTDReport(societyId));
    }

    /**
     * Get Year-to-Date financial report
     * Only accessible by MASTER_ADMIN, SOCIETY_ADMIN, and Committee Level roles
     */
    @GetMapping("/ytd/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<FinancialReportResponse> getYTDReport(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getYTDReport(societyId));
    }

    /**
     * Get custom date range financial report
     * Only accessible by MASTER_ADMIN, SOCIETY_ADMIN, and Committee Level roles
     */
    @GetMapping("/custom/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<FinancialReportResponse> getCustomReport(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getCustomReport(societyId, startDate, endDate));
    }

    /**
     * Get dashboard summary (quick overview)
     * Only accessible by MASTER_ADMIN, SOCIETY_ADMIN, and Committee Level roles
     */
    @GetMapping("/dashboard/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<FinancialReportResponse> getDashboardSummary(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getDashboardSummary(societyId));
    }

    /**
     * Get comparison report (current vs previous period)
     * Only accessible by MASTER_ADMIN, SOCIETY_ADMIN, and Committee Level roles
     */
    @GetMapping("/comparison/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<FinancialReportResponse> getComparisonReport(
            @PathVariable Long societyId,
            @RequestParam(defaultValue = "MONTH") String periodType) {
        return ResponseEntity.ok(reportService.getComparisonReport(societyId, periodType));
    }
}
