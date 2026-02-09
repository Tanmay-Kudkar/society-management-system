package com.society.backend.controller;

import com.society.backend.dto.wing.WingRequest;
import com.society.backend.dto.wing.WingResponse;
import com.society.backend.service.wing.WingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wings")
@RequiredArgsConstructor
public class WingController {

    private final WingService wingService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WingResponse>> getAll() {
        return ResponseEntity.ok(wingService.getAll());
    }

    @GetMapping("/society/{societyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WingResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(wingService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(wingService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<WingResponse> create(@Valid @RequestBody WingRequest request) {
        return ResponseEntity.ok(wingService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<WingResponse> update(@PathVariable Long id, @Valid @RequestBody WingRequest request) {
        return ResponseEntity.ok(wingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        wingService.delete(id);
        return ResponseEntity.ok().build();
    }
}
