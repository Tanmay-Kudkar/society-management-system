package com.society.backend.finance.controller;

import com.society.backend.finance.dto.request.PenaltyRequest;
import com.society.backend.finance.dto.response.PenaltyResponse;
import com.society.backend.finance.service.PenaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import com.society.backend.finance.entity.Payment;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/penalties")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PenaltyController {

    private final PenaltyService penaltyService;

    @PostMapping
    public ResponseEntity<PenaltyResponse> create(@Valid @RequestBody PenaltyRequest request, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PenaltyResponse> update(@PathVariable Long id, @Valid @RequestBody PenaltyRequest request, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PenaltyResponse> getById(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<PenaltyResponse>> getBySociety(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<PenaltyResponse>> getByStatus(@PathVariable Long societyId, @PathVariable String status, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getByStatus(societyId, status, userId));
    }

    @GetMapping("/society/{societyId}/payment/{paymentStatus}")
    public ResponseEntity<List<PenaltyResponse>> getByPaymentStatus(@PathVariable Long societyId, @PathVariable String paymentStatus, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getByPaymentStatus(societyId, paymentStatus, userId));
    }

    @GetMapping("/society/{societyId}/type/{penaltyType}")
    public ResponseEntity<List<PenaltyResponse>> getByType(@PathVariable Long societyId, @PathVariable String penaltyType, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getByType(societyId, penaltyType, userId));
    }

    @GetMapping("/user/{issuedToId}")
    public ResponseEntity<List<PenaltyResponse>> getByUser(@PathVariable Long issuedToId, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getByUser(issuedToId, userId));
    }

    @PatchMapping("/{id}/pay")
    public ResponseEntity<PenaltyResponse> markPaid(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.markPaid(id, userId));
    }

    @PatchMapping("/{id}/waive")
    public ResponseEntity<PenaltyResponse> waive(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, @RequestParam Long userId) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(penaltyService.waive(id, reason, userId));
    }

    @PatchMapping("/{id}/appeal")
    public ResponseEntity<PenaltyResponse> appeal(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, @RequestParam Long userId) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(penaltyService.appeal(id, notes, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(penaltyService.getCounts(societyId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        penaltyService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
