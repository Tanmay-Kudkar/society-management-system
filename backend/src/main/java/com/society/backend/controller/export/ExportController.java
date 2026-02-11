package com.society.backend.controller.export;

import com.society.backend.service.export.ExcelExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')")
public class ExportController {

        private final ExcelExportService excelExportService;

        @GetMapping("/transactions/{societyId}")
        public ResponseEntity<byte[]> exportTransactions(
                        @PathVariable Long societyId,
                        @RequestParam String startDate,
                        @RequestParam String endDate) {

                ByteArrayOutputStream outputStream = excelExportService.exportTransactions(societyId, startDate,
                                endDate);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=transactions_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/maintenance-bills/{societyId}")
        public ResponseEntity<byte[]> exportMaintenanceBills(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String month) {

                ByteArrayOutputStream outputStream = excelExportService.exportMaintenanceBills(societyId, month);

                String filename = "maintenance_bills_" + (month != null ? month : LocalDate.now()) + ".xlsx";
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/vendor-bills/{societyId}")
        public ResponseEntity<byte[]> exportVendorBills(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate) {

                ByteArrayOutputStream outputStream = excelExportService.exportVendorBills(societyId, startDate,
                                endDate);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=vendor_bills_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/tickets/{societyId}")
        public ResponseEntity<byte[]> exportTickets(
                        @PathVariable Long societyId,
                        @RequestParam(required = false) String status) {

                ByteArrayOutputStream outputStream = excelExportService.exportTickets(societyId, status);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=tickets_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/flats/{societyId}")
        public ResponseEntity<byte[]> exportFlats(@PathVariable Long societyId) {

                ByteArrayOutputStream outputStream = excelExportService.exportFlats(societyId);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=flats_directory_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/financial-report/{societyId}")
        public ResponseEntity<byte[]> exportFinancialReport(
                        @PathVariable Long societyId,
                        @RequestParam String reportType,
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate) {

                ByteArrayOutputStream outputStream = excelExportService.exportFinancialReport(societyId, reportType,
                                startDate,
                                endDate);

                String filename = reportType.toLowerCase() + "_financial_report_" + LocalDate.now() + ".xlsx";
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/all-transactions")
        public ResponseEntity<byte[]> exportAllTransactions(
                        @RequestParam String startDate,
                        @RequestParam String endDate) {

                ByteArrayOutputStream outputStream = excelExportService.exportTransactions(null, startDate, endDate);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=all_transactions_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }

        @GetMapping("/all-tickets")
        public ResponseEntity<byte[]> exportAllTickets(@RequestParam(required = false) String status) {

                ByteArrayOutputStream outputStream = excelExportService.exportTickets(null, status);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=all_tickets_" + LocalDate.now() + ".xlsx")
                                .contentType(
                                                MediaType.parseMediaType(
                                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(outputStream.toByteArray());
        }
}
