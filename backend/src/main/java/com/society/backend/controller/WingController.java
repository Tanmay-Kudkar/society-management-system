package com.society.backend.controller;

import com.society.backend.dto.wing.BulkWingImportResponse;
import com.society.backend.dto.wing.WingImportRow;
import com.society.backend.dto.wing.WingRequest;
import com.society.backend.dto.wing.WingResponse;
import com.society.backend.service.wing.BulkWingImportService;
import com.society.backend.service.wing.WingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/wings")
@RequiredArgsConstructor
public class WingController {

    private final WingService wingService;
    private final BulkWingImportService bulkWingImportService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WingResponse>> getAll() {
        return ResponseEntity.ok(wingService.getAll());
    }

    @GetMapping("/society/{societyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WingResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(wingService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(wingService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<WingResponse> create(@Valid @RequestBody WingRequest request) {
        return ResponseEntity.ok(wingService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<WingResponse> update(@PathVariable Long id, @Valid @RequestBody WingRequest request) {
        return ResponseEntity.ok(wingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        wingService.delete(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkWingImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<WingImportRow> rows = bulkWingImportService.parseExcelFile(file);
        BulkWingImportResponse response = bulkWingImportService.validateImportRows(rows, societyId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkWingImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<WingImportRow> rows = bulkWingImportService.parseExcelFile(file);
        BulkWingImportResponse validationResponse = bulkWingImportService.validateImportRows(rows, societyId);
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }
        BulkWingImportResponse processResponse = bulkWingImportService.processImport(rows, societyId);
        return ResponseEntity.ok(processResponse);
    }

    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkWingImportService.generateTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=wing_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
