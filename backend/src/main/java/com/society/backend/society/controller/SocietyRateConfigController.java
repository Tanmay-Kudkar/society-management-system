package com.society.backend.controller.society;

import com.society.backend.dto.society.SocietyRateConfigRequest;
import com.society.backend.dto.society.SocietyRateConfigResponse;
import com.society.backend.service.society.SocietyRateConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for managing per-society charge rate configurations.
 * F08 — Society Rate Configuration
 */
@RestController
@RequestMapping("/api/rate-configs")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SocietyRateConfigController {

    private final SocietyRateConfigService rateConfigService;

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<SocietyRateConfigResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(rateConfigService.getBySociety(societyId));
    }

    @GetMapping("/society/{societyId}/active")
    public ResponseEntity<List<SocietyRateConfigResponse>> getActiveBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(rateConfigService.getActiveBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocietyRateConfigResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(rateConfigService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER','ORGANIZATION_OWNER','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER')")
    public ResponseEntity<SocietyRateConfigResponse> create(
            @Valid @RequestBody SocietyRateConfigRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rateConfigService.create(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER','ORGANIZATION_OWNER','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER')")
    public ResponseEntity<SocietyRateConfigResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SocietyRateConfigRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(rateConfigService.update(id, request, userId));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER','ORGANIZATION_OWNER','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER')")
    public ResponseEntity<Void> toggle(@PathVariable Long id, @RequestParam Long userId) {
        rateConfigService.toggleActive(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER','ORGANIZATION_OWNER','SOCIETY_ADMIN','CHAIRMAN','SECRETARY','TREASURER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        rateConfigService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
