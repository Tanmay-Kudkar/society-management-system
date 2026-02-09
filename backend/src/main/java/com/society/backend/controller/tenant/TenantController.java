package com.society.backend.controller.tenant;

import com.society.backend.dto.tenant.BulkTenantImportResponse;
import com.society.backend.dto.tenant.TenantImportRow;
import com.society.backend.dto.tenant.TenantRequest;
import com.society.backend.dto.tenant.TenantResponse;
import com.society.backend.service.tenant.BulkTenantImportService;
import com.society.backend.service.tenant.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TenantController {

    private final TenantService tenantService;
    private final BulkTenantImportService bulkTenantImportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER', 'MEMBER')")
    public ResponseEntity<TenantResponse> create(
            @Valid @RequestBody TenantRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.getById(id));
    }

    @GetMapping("/flat/{flatId}")
    public ResponseEntity<List<TenantResponse>> getByFlatId(@PathVariable Long flatId) {
        return ResponseEntity.ok(tenantService.getByFlatId(flatId));
    }

    @GetMapping
    public ResponseEntity<List<TenantResponse>> getAll() {
        return ResponseEntity.ok(tenantService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TenantResponse>> getActive() {
        return ResponseEntity.ok(tenantService.getActive());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER', 'MEMBER')")
    public ResponseEntity<TenantResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TenantRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(tenantService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER', 'MEMBER')")
    public ResponseEntity<TenantResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(tenantService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        tenantService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkTenantImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<TenantImportRow> rows = bulkTenantImportService.parseExcelFile(file);
        BulkTenantImportResponse response = bulkTenantImportService.validateImportRows(rows, societyId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkTenantImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<TenantImportRow> rows = bulkTenantImportService.parseExcelFile(file);
        BulkTenantImportResponse validationResponse = bulkTenantImportService.validateImportRows(rows, societyId);
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }
        BulkTenantImportResponse processResponse = bulkTenantImportService.processImport(rows, societyId);
        return ResponseEntity.ok(processResponse);
    }

    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkTenantImportService.generateTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=tenant_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
