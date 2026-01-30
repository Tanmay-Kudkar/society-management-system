package com.society.backend.controller.report;

import com.society.backend.dto.report.FinancialReportResponse;
import com.society.backend.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    /**
     * Get Month-to-Date financial report
     */
    @GetMapping("/mtd/{societyId}")
    public ResponseEntity<FinancialReportResponse> getMTDReport(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getMTDReport(societyId));
    }

    /**
     * Get Year-to-Date financial report
     */
    @GetMapping("/ytd/{societyId}")
    public ResponseEntity<FinancialReportResponse> getYTDReport(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getYTDReport(societyId));
    }

    /**
     * Get custom date range financial report
     */
    @GetMapping("/custom/{societyId}")
    public ResponseEntity<FinancialReportResponse> getCustomReport(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getCustomReport(societyId, startDate, endDate));
    }

    /**
     * Get dashboard summary (quick overview)
     */
    @GetMapping("/dashboard/{societyId}")
    public ResponseEntity<FinancialReportResponse> getDashboardSummary(@PathVariable Long societyId) {
        return ResponseEntity.ok(reportService.getDashboardSummary(societyId));
    }

    /**
     * Get comparison report (current vs previous period)
     */
    @GetMapping("/comparison/{societyId}")
    public ResponseEntity<FinancialReportResponse> getComparisonReport(
            @PathVariable Long societyId,
            @RequestParam(defaultValue = "MONTH") String periodType) {
        return ResponseEntity.ok(reportService.getComparisonReport(societyId, periodType));
    }
}
