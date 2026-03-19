package com.society.backend.common.controller;

import com.society.backend.common.service.ExcelExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

import com.society.backend.vendor.entity.Vendor;
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
public class ExportController {

        private final ExcelExportService excelExportService;

        @GetMapping("/transactions/{societyId}")
        public ResponseEntity<byte[]> exportTransactions(
                        @PathVariable Long societyId,
                        @RequestParam String startDate,
                        @RequestParam String endDate,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportTransactions(societyId, startDate, endDate)
                                : excelExportService.exportTransactionsCsv(societyId, startDate, endDate);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=transactions_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/maintenance-bills/{societyId}")
        public ResponseEntity<byte[]> exportMaintenanceBills(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String month,
                        @RequestParam(defaultValue = "csv") String format) {

                ByteArrayOutputStream outputStream;
                String filename;
                MediaType mediaType;

                if ("xlsx".equalsIgnoreCase(format)) {
                        outputStream = excelExportService.exportMaintenanceBills(societyId, month);
                        filename = "maintenance_bills_" + (month != null ? month : LocalDate.now()) + ".xlsx";
                        mediaType = MediaType.parseMediaType(
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                } else {
                        outputStream = excelExportService.exportMaintenanceBillsCsv(societyId, month);
                        filename = "maintenance_bills_" + (month != null ? month : LocalDate.now()) + ".csv";
                        mediaType = new MediaType("text", "csv", StandardCharsets.UTF_8);
                }

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(mediaType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/vendor-bills/{societyId}")
        public ResponseEntity<byte[]> exportVendorBills(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate,
                        @RequestParam(defaultValue = "csv") String format) {

                ByteArrayOutputStream outputStream;
                String filename;
                MediaType mediaType;

                if ("xlsx".equalsIgnoreCase(format)) {
                        outputStream = excelExportService.exportVendorBills(societyId, startDate, endDate);
                        filename = "vendor_bills_" + LocalDate.now() + ".xlsx";
                        mediaType = MediaType.parseMediaType(
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                } else {
                        outputStream = excelExportService.exportVendorBillsCsv(societyId, startDate, endDate);
                        filename = "vendor_bills_" + LocalDate.now() + ".csv";
                        mediaType = new MediaType("text", "csv", StandardCharsets.UTF_8);
                }

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(mediaType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/tickets/{societyId}")
        public ResponseEntity<byte[]> exportTickets(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String status,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportTickets(societyId, status)
                                : excelExportService.exportTicketsCsv(societyId, status);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=tickets_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/flats/{societyId}")
        public ResponseEntity<byte[]> exportFlats(
                        @PathVariable Long societyId,
                        @RequestParam(defaultValue = "csv") String format) {

                ByteArrayOutputStream outputStream;
                String filename;
                MediaType mediaType;

                if ("xlsx".equalsIgnoreCase(format)) {
                        outputStream = excelExportService.exportFlats(societyId);
                        filename = "flats_" + LocalDate.now() + ".xlsx";
                        mediaType = MediaType.parseMediaType(
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                } else {
                        outputStream = excelExportService.exportFlatsCsv(societyId);
                        filename = "flats_" + LocalDate.now() + ".csv";
                        mediaType = new MediaType("text", "csv", StandardCharsets.UTF_8);
                }

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(mediaType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/financial-report/{societyId}")
        public ResponseEntity<byte[]> exportFinancialReport(
                        @PathVariable Long societyId,
                        @RequestParam String reportType,
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportFinancialReport(societyId, reportType, startDate, endDate)
                                : excelExportService.exportFinancialReportCsv(societyId, reportType, startDate, endDate);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                String filename = reportType.toLowerCase() + "_financial_report_" + LocalDate.now() + "." + extension;
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/all-transactions")
        @PreAuthorize("hasRole('MASTER_ADMIN')")
        public ResponseEntity<byte[]> exportAllTransactions(
                        @RequestParam String startDate,
                        @RequestParam String endDate,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportTransactions(null, startDate, endDate)
                                : excelExportService.exportTransactionsCsv(null, startDate, endDate);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=all_transactions_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/all-tickets")
        @PreAuthorize("hasRole('MASTER_ADMIN')")
        public ResponseEntity<byte[]> exportAllTickets(@RequestParam(required = false) String status,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportTickets(null, status)
                                : excelExportService.exportTicketsCsv(null, status);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=all_tickets_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/payments/{societyId}")
        public ResponseEntity<byte[]> exportPaymentsBySociety(
                        @PathVariable Long societyId,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportPayments(societyId, null)
                                : excelExportService.exportPaymentsCsv(societyId, null);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=payments_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/payments/user/{userId}")
        public ResponseEntity<byte[]> exportPaymentsByUser(
                        @PathVariable Long userId,
                        @RequestParam(defaultValue = "csv") String format) {

                String normalizedFormat = format == null ? "CSV" : format.trim().toUpperCase();
                boolean useExcel = "XLSX".equals(normalizedFormat) || "EXCEL".equals(normalizedFormat);
                ByteArrayOutputStream outputStream = useExcel
                                ? excelExportService.exportPayments(null, userId)
                                : excelExportService.exportPaymentsCsv(null, userId);

                String extension = useExcel ? "xlsx" : "csv";
                MediaType contentType = useExcel
                                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=payments_" + LocalDate.now() + "." + extension)
                                .contentType(contentType)
                                .body(outputStream.toByteArray());
        }
}



