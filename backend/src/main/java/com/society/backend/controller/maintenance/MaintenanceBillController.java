package com.society.backend.controller.maintenance;

import com.society.backend.dto.maintenance.MaintenanceBillRequest;
import com.society.backend.dto.maintenance.MaintenanceBillResponse;
import com.society.backend.service.maintenance.MaintenanceBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/maintenance-bills")
@RequiredArgsConstructor
public class MaintenanceBillController {

    private final MaintenanceBillService maintenanceBillService;

    @PostMapping
    public ResponseEntity<MaintenanceBillResponse> create(
            @Valid @RequestBody MaintenanceBillRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceBillService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceBillResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceBillService.getById(id));
    }

    @GetMapping("/flat/{flatId}")
    public ResponseEntity<List<MaintenanceBillResponse>> getByFlatId(@PathVariable Long flatId) {
        return ResponseEntity.ok(maintenanceBillService.getByFlatId(flatId));
    }

    @GetMapping("/month/{billMonth}")
    public ResponseEntity<List<MaintenanceBillResponse>> getByBillMonth(@PathVariable String billMonth) {
        return ResponseEntity.ok(maintenanceBillService.getByBillMonth(billMonth));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<MaintenanceBillResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(maintenanceBillService.getByStatus(status));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<MaintenanceBillResponse>> getPending() {
        return ResponseEntity.ok(maintenanceBillService.getPending());
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceBillResponse>> getAll() {
        return ResponseEntity.ok(maintenanceBillService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceBillResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceBillRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(maintenanceBillService.update(id, request, userId));
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<MaintenanceBillResponse> recordPayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMode,
            @RequestParam(required = false) String referenceNumber,
            @RequestParam Long userId) {
        return ResponseEntity
                .ok(maintenanceBillService.recordPayment(id, amount, paymentMode, referenceNumber, userId));
    }

    @PostMapping("/generate")
    public ResponseEntity<Void> generateBillsForSociety(
            @RequestParam Long societyId,
            @RequestParam String billMonth,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String propertyType,
            @RequestParam Long userId) {
        maintenanceBillService.generateBillsForSociety(societyId, billMonth, amount, propertyType, userId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/generate/preview")
    public ResponseEntity<Integer> getGenerationPreviewCount(
            @RequestParam Long societyId,
            @RequestParam String billMonth,
            @RequestParam(required = false) String propertyType) {
        int count = maintenanceBillService.getGenerationPreviewCount(societyId, billMonth, propertyType);
        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        maintenanceBillService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
