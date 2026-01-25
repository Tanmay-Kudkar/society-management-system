package com.society.backend.controller;

import com.society.backend.dto.TenantRequest;
import com.society.backend.dto.TenantResponse;
import com.society.backend.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
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
    public ResponseEntity<TenantResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TenantRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(tenantService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<TenantResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(tenantService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        tenantService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
