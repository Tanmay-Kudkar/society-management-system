package com.society.backend.flat.controller;

import com.society.backend.flat.dto.request.PetRegistrationRequest;
import com.society.backend.flat.dto.response.PetRegistrationResponse;
import com.society.backend.flat.service.PetRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/pet-registrations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PetRegistrationController {

    private final PetRegistrationService service;

    @PostMapping
    public ResponseEntity<PetRegistrationResponse> create(@Valid @RequestBody PetRegistrationRequest request,
                                                          @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PetRegistrationResponse> update(@PathVariable Long id,
                                                          @Valid @RequestBody PetRegistrationRequest request,
                                                          @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetRegistrationResponse> getById(@PathVariable Long id,
                                                           @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<PetRegistrationResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String petType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getBySociety(societyId, status, petType,
                PageRequest.of(page, size, Sort.by("createdAt").descending()), userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestHeader("X-User-Id") Long userId) {
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<PetRegistrationResponse> approve(@PathVariable Long id,
                                                           @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.approve(id, userId));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<PetRegistrationResponse> reject(@PathVariable Long id,
                                                          @RequestBody Map<String, String> body,
                                                          @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.reject(id, body.get("reason"), userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getCounts(societyId, userId));
    }
}
