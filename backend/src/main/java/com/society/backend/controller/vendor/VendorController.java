package com.society.backend.controller.vendor;

import com.society.backend.dto.vendor.VendorRequest;
import com.society.backend.dto.vendor.VendorResponse;
import com.society.backend.service.vendor.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
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
    public ResponseEntity<VendorResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody VendorRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<VendorResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(vendorService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        vendorService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
