package com.society.backend.ticket.controller;

import com.society.backend.ticket.dto.BulkEmergencyContactImportResponse;
import com.society.backend.ticket.dto.EmergencyContactImportRow;
import com.society.backend.ticket.dto.EmergencyContactRequest;
import com.society.backend.ticket.dto.EmergencyContactResponse;
import com.society.backend.ticket.service.BulkEmergencyContactImportService;
import com.society.backend.ticket.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/emergency-contacts")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;
    private final BulkEmergencyContactImportService bulkEmergencyContactImportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<EmergencyContactResponse> create(
            @Valid @RequestBody EmergencyContactRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emergencyContactService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmergencyContactResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(emergencyContactService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<EmergencyContactResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(emergencyContactService.getBySocietyId(societyId));
    }

    @GetMapping("/type/{contactType}")
    public ResponseEntity<List<EmergencyContactResponse>> getByContactType(@PathVariable String contactType) {
        return ResponseEntity.ok(emergencyContactService.getByContactType(contactType));
    }

    @GetMapping
    public ResponseEntity<List<EmergencyContactResponse>> getAll() {
        return ResponseEntity.ok(emergencyContactService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<EmergencyContactResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyContactRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(emergencyContactService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<EmergencyContactResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(emergencyContactService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        emergencyContactService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BulkEmergencyContactImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<EmergencyContactImportRow> rows = bulkEmergencyContactImportService.parseExcelFile(file);
        BulkEmergencyContactImportResponse response = bulkEmergencyContactImportService.validateImportRows(rows,
                societyId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BulkEmergencyContactImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId,
            @RequestParam Long userId) throws java.io.IOException {
        List<EmergencyContactImportRow> rows = bulkEmergencyContactImportService.parseExcelFile(file);
        BulkEmergencyContactImportResponse validationResponse = bulkEmergencyContactImportService
                .validateImportRows(rows, societyId);
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }
        BulkEmergencyContactImportResponse processResponse = bulkEmergencyContactImportService.processImport(rows,
                societyId, userId);
        return ResponseEntity.ok(processResponse);
    }

    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkEmergencyContactImportService.generateTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=emergency_contact_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
