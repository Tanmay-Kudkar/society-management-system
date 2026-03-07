package com.society.backend.flat.controller;

import com.society.backend.flat.dto.request.RenovationNocRequest;
import com.society.backend.flat.dto.response.RenovationNocResponse;
import com.society.backend.flat.service.RenovationNocService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/renovation-nocs")
@RequiredArgsConstructor
public class RenovationNocController {

    private final RenovationNocService renovationNocService;

    @PostMapping
    public ResponseEntity<RenovationNocResponse> create(@Valid @RequestBody RenovationNocRequest request,
                                                         @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RenovationNocResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody RenovationNocRequest request,
                                                         @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RenovationNocResponse> getById(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<RenovationNocResponse>> getBySociety(@PathVariable Long societyId,
                                                                      @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<RenovationNocResponse>> getByStatus(@PathVariable Long societyId,
                                                                     @PathVariable String status,
                                                                     @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getByStatus(societyId, status, userId));
    }

    @GetMapping("/society/{societyId}/type/{renovationType}")
    public ResponseEntity<List<RenovationNocResponse>> getByType(@PathVariable Long societyId,
                                                                   @PathVariable String renovationType,
                                                                   @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getByType(societyId, renovationType, userId));
    }

    @GetMapping("/user/{requestedById}")
    public ResponseEntity<List<RenovationNocResponse>> getByUser(@PathVariable Long requestedById,
                                                                   @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getByUser(requestedById, userId));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<RenovationNocResponse> approve(@PathVariable Long id,
                                                          @RequestBody(required = false) Map<String, String> body,
                                                          @RequestParam Long userId) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(renovationNocService.approve(id, notes, userId));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<RenovationNocResponse> reject(@PathVariable Long id,
                                                         @RequestBody(required = false) Map<String, String> body,
                                                         @RequestParam Long userId) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(renovationNocService.reject(id, reason, userId));
    }

    @PatchMapping("/{id}/in-progress")
    public ResponseEntity<RenovationNocResponse> markInProgress(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.markInProgress(id, userId));
    }

    @PatchMapping("/{id}/completed")
    public ResponseEntity<RenovationNocResponse> markCompleted(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.markCompleted(id, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(renovationNocService.getCounts(societyId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        renovationNocService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
