package com.society.backend.flat.controller;

import com.society.backend.flat.dto.request.WingRequest;
import com.society.backend.flat.dto.response.WingResponse;
import com.society.backend.flat.service.WingService;
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

    @GetMapping("/society/{societyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WingResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(wingService.getBySociety(societyId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<WingResponse> create(@Valid @RequestBody WingRequest request) {
        return ResponseEntity.ok(wingService.create(request));
    }

    @PostMapping("/society/{societyId}/sync-config")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN')")
    public ResponseEntity<String> syncWithSocietyConfig(
            @PathVariable Long societyId,
            @RequestParam(defaultValue = "false") boolean force) {
        int removed = wingService.syncWithSocietyConfig(societyId, force);
        return ResponseEntity.ok("Wing synchronization complete. Removed " + removed + " extra wing(s).");
    }
}
