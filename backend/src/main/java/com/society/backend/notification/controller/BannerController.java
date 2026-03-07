package com.society.backend.notification.controller;

import com.society.backend.notification.dto.request.BannerRequest;
import com.society.backend.notification.dto.response.BannerResponse;
import com.society.backend.notification.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.society.backend.society.entity.Society;
@RestController
@RequestMapping("/banners")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class BannerController {

    private final BannerService bannerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BannerResponse> create(
            @Valid @RequestBody BannerRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bannerService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BannerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<BannerResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(bannerService.getBySocietyId(societyId));
    }

    @GetMapping("/active/{societyId}")
    public ResponseEntity<List<BannerResponse>> getActiveBanners(@PathVariable Long societyId) {
        return ResponseEntity.ok(bannerService.getActiveBanners(societyId));
    }

    @GetMapping
    public ResponseEntity<List<BannerResponse>> getAll() {
        return ResponseEntity.ok(bannerService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BannerResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BannerRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bannerService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<BannerResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bannerService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        bannerService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
