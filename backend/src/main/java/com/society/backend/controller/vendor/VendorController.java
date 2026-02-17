package com.society.backend.controller.vendor;

import com.society.backend.dto.vendor.BulkVendorImportResponse;
import com.society.backend.dto.vendor.VendorImportRow;
import com.society.backend.dto.vendor.VendorRequest;
import com.society.backend.dto.vendor.VendorResponse;
import com.society.backend.service.vendor.BulkVendorImportService;
import com.society.backend.service.vendor.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/vendors")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class VendorController {

    private final VendorService vendorService;
    private final BulkVendorImportService bulkVendorImportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<VendorResponse> create(
            @Valid @RequestBody VendorRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<VendorResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(vendorService.getBySocietyId(societyId));
    }

    @GetMapping("/common")
    public ResponseEntity<List<VendorResponse>> getCommonVendors() {
        return ResponseEntity.ok(vendorService.getCommonVendors());
    }

    @GetMapping("/service-type/{serviceType}")
    public ResponseEntity<List<VendorResponse>> getByServiceType(@PathVariable String serviceType) {
        return ResponseEntity.ok(vendorService.getByServiceType(serviceType));
    }

    @GetMapping
    public ResponseEntity<List<VendorResponse>> getAll() {
        return ResponseEntity.ok(vendorService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<VendorResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody VendorRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<VendorResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean force) {
        vendorService.delete(id, userId, force);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<VendorResponse> approveVendor(
            @PathVariable Long id,
            @RequestParam Long userId) {
        VendorResponse response = vendorService.approveVendor(id, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<VendorResponse> rejectVendor(
            @PathVariable Long id,
            @RequestParam Long userId) {
        VendorResponse response = vendorService.rejectVendor(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<VendorResponse>> getPendingVendors(
            @RequestParam(required = false) Long societyId) {
        List<VendorResponse> vendors = vendorService.getPendingVendors(societyId);
        return ResponseEntity.ok(vendors);
    }

    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BulkVendorImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<VendorImportRow> rows = bulkVendorImportService.parseExcelFile(file);
        BulkVendorImportResponse response = bulkVendorImportService.validateImportRows(rows, societyId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BulkVendorImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<VendorImportRow> rows = bulkVendorImportService.parseExcelFile(file);
        BulkVendorImportResponse validationResponse = bulkVendorImportService.validateImportRows(rows, societyId);
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }
        BulkVendorImportResponse processResponse = bulkVendorImportService.processImport(rows, societyId);
        return ResponseEntity.ok(processResponse);
    }

    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkVendorImportService.generateTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=vendor_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
