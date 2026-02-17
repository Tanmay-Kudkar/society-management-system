package com.society.backend.controller.flat;

import com.society.backend.dto.flat.BulkFlatImportResponse;
import com.society.backend.dto.flat.FlatImportRow;
import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;
import com.society.backend.service.flat.BulkFlatImportService;
import com.society.backend.service.flat.FlatService;
import com.society.backend.service.common.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/flats")
@PreAuthorize("isAuthenticated()")
public class FlatController {

    private final FlatService flatService;
    private final RoleService roleService;
    private final BulkFlatImportService bulkFlatImportService;

    public FlatController(FlatService flatService, RoleService roleService,
            BulkFlatImportService bulkFlatImportService) {
        this.flatService = flatService;
        this.roleService = roleService;
        this.bulkFlatImportService = bulkFlatImportService;
    }

    // PLATFORM_OWNER, COMMITTEE only
    @PostMapping
    public ResponseEntity<FlatResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody FlatRequest request) {
        roleService.canManageFlats(userId);
        return ResponseEntity.ok(flatService.create(request));
    }

    // All authenticated users can view (filtered by their society if not
    // PLATFORM_OWNER)
    @GetMapping
    public ResponseEntity<List<FlatResponse>> getAll(@RequestParam Long userId) {
        return ResponseEntity.ok(flatService.getAll(userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<FlatResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(flatService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlatResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(flatService.getById(id));
    }

    // PLATFORM_OWNER, COMMITTEE only
    @PutMapping("/{id}")
    public ResponseEntity<FlatResponse> update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody FlatRequest request) {
        roleService.canManageFlats(userId);
        return ResponseEntity.ok(flatService.update(id, request));
    }

    // PLATFORM_OWNER, COMMITTEE only
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean force) {
        roleService.canManageFlats(userId);
        flatService.delete(id, force);
        return ResponseEntity.noContent().build();
    }

    /**
     * Validate bulk unit import from Excel file.
     * Returns parsed data with validation status for preview before actual import.
     */
    @PostMapping("/bulk-import/validate")
    public ResponseEntity<BulkFlatImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId,
            @RequestParam Long userId) throws java.io.IOException {
        roleService.canManageFlats(userId);
        List<FlatImportRow> rows = bulkFlatImportService.parseExcelFile(file);
        BulkFlatImportResponse response = bulkFlatImportService.validateImportRows(rows, societyId);
        return ResponseEntity.ok(response);
    }

    /**
     * Process bulk unit import from Excel file.
     * Creates units from previously validated data.
     */
    @PostMapping("/bulk-import")
    public ResponseEntity<BulkFlatImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId,
            @RequestParam Long userId) throws java.io.IOException {
        roleService.canManageFlats(userId);

        // Parse, validate, and process
        List<FlatImportRow> rows = bulkFlatImportService.parseExcelFile(file);
        BulkFlatImportResponse validationResponse = bulkFlatImportService.validateImportRows(rows, societyId);

        // Only process if there are no validation errors
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }

        // Process the import
        BulkFlatImportResponse processResponse = bulkFlatImportService.processImport(rows, societyId);
        return ResponseEntity.ok(processResponse);
    }

    /**
     * Download Excel template for bulk unit import.
     */
    @GetMapping("/bulk-import/template")
    public ResponseEntity<byte[]> downloadImportTemplate(@RequestParam Long userId) {
        roleService.canManageFlats(userId);
        byte[] template = bulkFlatImportService.generateTemplate();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=unit_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
