package com.society.backend.controller.vehicle;

import com.society.backend.dto.vehicle.BulkVehicleImportResponse;
import com.society.backend.dto.vehicle.VehicleImportRow;
import com.society.backend.dto.vehicle.VehicleRequest;
import com.society.backend.dto.vehicle.VehicleResponse;
import com.society.backend.service.vehicle.BulkVehicleImportService;
import com.society.backend.service.vehicle.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class VehicleController {

    private final VehicleService vehicleService;
    private final BulkVehicleImportService bulkVehicleImportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER')")
    public ResponseEntity<VehicleResponse> create(
            @Valid @RequestBody VehicleRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @GetMapping("/flat/{flatId}")
    public ResponseEntity<List<VehicleResponse>> getByFlatId(@PathVariable Long flatId) {
        return ResponseEntity.ok(vehicleService.getByFlatId(flatId));
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getAll() {
        return ResponseEntity.ok(vehicleService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER')")
    public ResponseEntity<VehicleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vehicleService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        vehicleService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-import/validate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkVehicleImportResponse> validateBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<VehicleImportRow> rows = bulkVehicleImportService.parseExcelFile(file);
        BulkVehicleImportResponse response = bulkVehicleImportService.validateImportRows(rows, societyId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<BulkVehicleImportResponse> processBulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("societyId") Long societyId) throws java.io.IOException {
        List<VehicleImportRow> rows = bulkVehicleImportService.parseExcelFile(file);
        BulkVehicleImportResponse validationResponse = bulkVehicleImportService.validateImportRows(rows, societyId);
        if (validationResponse.getFailureCount() > 0) {
            validationResponse.setMessage("Import failed: Please fix validation errors and try again");
            return ResponseEntity.badRequest().body(validationResponse);
        }
        BulkVehicleImportResponse processResponse = bulkVehicleImportService.processImport(rows, societyId);
        return ResponseEntity.ok(processResponse);
    }

    @GetMapping("/bulk-import/template")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] template = bulkVehicleImportService.generateTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=vehicle_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(template);
    }
}
