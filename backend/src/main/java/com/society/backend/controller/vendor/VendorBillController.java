package com.society.backend.controller.vendor;

import com.society.backend.dto.vendor.VendorBillRequest;
import com.society.backend.dto.vendor.VendorBillResponse;
import com.society.backend.service.vendor.VendorBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/vendor-bills")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class VendorBillController {

    private final VendorBillService vendorBillService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<VendorBillResponse> create(
            @Valid @RequestBody VendorBillRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorBillService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorBillResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorBillService.getById(id));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<VendorBillResponse>> getByVendorId(@PathVariable Long vendorId) {
        return ResponseEntity.ok(vendorBillService.getByVendorId(vendorId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<VendorBillResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(vendorBillService.getBySocietyId(societyId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<VendorBillResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(vendorBillService.getByStatus(status));
    }

    @GetMapping("/pending/{societyId}")
    public ResponseEntity<List<VendorBillResponse>> getPending(@PathVariable Long societyId) {
        return ResponseEntity.ok(vendorBillService.getPending(societyId));
    }

    @GetMapping
    public ResponseEntity<List<VendorBillResponse>> getAll() {
        return ResponseEntity.ok(vendorBillService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<VendorBillResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody VendorBillRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorBillService.update(id, request, userId));
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<VendorBillResponse> recordPayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMode,
            @RequestParam(required = false) String referenceNumber,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorBillService.recordPayment(id, amount, paymentMode, referenceNumber, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        vendorBillService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
