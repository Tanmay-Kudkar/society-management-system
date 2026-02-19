package com.society.backend.controller;

import com.society.backend.dto.request.RenovationNocRequest;
import com.society.backend.dto.response.RenovationNocResponse;
import com.society.backend.service.RenovationNocService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/renovation-nocs")
@RequiredArgsConstructor
public class RenovationNocController {

    private final RenovationNocService renovationNocService;

    private Long getUserId(Authentication auth) {
        return Long.parseLong(auth.getName());
    }

    @PostMapping
    public ResponseEntity<RenovationNocResponse> create(@Valid @RequestBody RenovationNocRequest request,
                                                         Authentication auth) {
        return ResponseEntity.ok(renovationNocService.create(request, getUserId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RenovationNocResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody RenovationNocRequest request,
                                                         Authentication auth) {
        return ResponseEntity.ok(renovationNocService.update(id, request, getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RenovationNocResponse> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getById(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<RenovationNocResponse>> getBySociety(@PathVariable Long societyId,
                                                                      Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getBySociety(societyId, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<RenovationNocResponse>> getByStatus(@PathVariable Long societyId,
                                                                     @PathVariable String status,
                                                                     Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getByStatus(societyId, status, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/type/{renovationType}")
    public ResponseEntity<List<RenovationNocResponse>> getByType(@PathVariable Long societyId,
                                                                   @PathVariable String renovationType,
                                                                   Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getByType(societyId, renovationType, getUserId(auth)));
    }

    @GetMapping("/user/{requestedById}")
    public ResponseEntity<List<RenovationNocResponse>> getByUser(@PathVariable Long requestedById,
                                                                   Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getByUser(requestedById, getUserId(auth)));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<RenovationNocResponse> approve(@PathVariable Long id,
                                                          @RequestBody(required = false) Map<String, String> body,
                                                          Authentication auth) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(renovationNocService.approve(id, notes, getUserId(auth)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<RenovationNocResponse> reject(@PathVariable Long id,
                                                         @RequestBody(required = false) Map<String, String> body,
                                                         Authentication auth) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(renovationNocService.reject(id, reason, getUserId(auth)));
    }

    @PatchMapping("/{id}/in-progress")
    public ResponseEntity<RenovationNocResponse> markInProgress(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(renovationNocService.markInProgress(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/completed")
    public ResponseEntity<RenovationNocResponse> markCompleted(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(renovationNocService.markCompleted(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(renovationNocService.getCounts(societyId, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        renovationNocService.delete(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
