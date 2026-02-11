package com.society.backend.controller.organization;

import com.society.backend.dto.organization.OrganizationRequest;
import com.society.backend.dto.organization.OrganizationResponse;
import com.society.backend.service.organization.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER')")
    public ResponseEntity<OrganizationResponse> create(
            @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(organizationService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER')")
    public ResponseEntity<List<OrganizationResponse>> getAll() {
        return ResponseEntity.ok(organizationService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER')")
    public ResponseEntity<OrganizationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getById(id));
    }

    @GetMapping("/by-owner")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER')")
    public ResponseEntity<List<OrganizationResponse>> getByOwnerEmail(@RequestParam String email) {
        return ResponseEntity.ok(organizationService.getByOwnerEmail(email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER')")
    public ResponseEntity<OrganizationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(organizationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        organizationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
