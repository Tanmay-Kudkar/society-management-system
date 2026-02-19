package com.society.backend.controller;

import com.society.backend.dto.request.PenaltyRequest;
import com.society.backend.dto.response.PenaltyResponse;
import com.society.backend.service.PenaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/penalties")
@RequiredArgsConstructor
public class PenaltyController {

    private final PenaltyService penaltyService;

    private Long getUserId(Authentication auth) { return Long.parseLong(auth.getName()); }

    @PostMapping
    public ResponseEntity<PenaltyResponse> create(@Valid @RequestBody PenaltyRequest request, Authentication auth) {
        return ResponseEntity.ok(penaltyService.create(request, getUserId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PenaltyResponse> update(@PathVariable Long id, @Valid @RequestBody PenaltyRequest request, Authentication auth) {
        return ResponseEntity.ok(penaltyService.update(id, request, getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PenaltyResponse> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getById(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<PenaltyResponse>> getBySociety(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getBySociety(societyId, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<PenaltyResponse>> getByStatus(@PathVariable Long societyId, @PathVariable String status, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getByStatus(societyId, status, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/payment/{paymentStatus}")
    public ResponseEntity<List<PenaltyResponse>> getByPaymentStatus(@PathVariable Long societyId, @PathVariable String paymentStatus, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getByPaymentStatus(societyId, paymentStatus, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/type/{penaltyType}")
    public ResponseEntity<List<PenaltyResponse>> getByType(@PathVariable Long societyId, @PathVariable String penaltyType, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getByType(societyId, penaltyType, getUserId(auth)));
    }

    @GetMapping("/user/{issuedToId}")
    public ResponseEntity<List<PenaltyResponse>> getByUser(@PathVariable Long issuedToId, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getByUser(issuedToId, getUserId(auth)));
    }

    @PatchMapping("/{id}/pay")
    public ResponseEntity<PenaltyResponse> markPaid(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(penaltyService.markPaid(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/waive")
    public ResponseEntity<PenaltyResponse> waive(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(penaltyService.waive(id, reason, getUserId(auth)));
    }

    @PatchMapping("/{id}/appeal")
    public ResponseEntity<PenaltyResponse> appeal(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(penaltyService.appeal(id, notes, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(penaltyService.getCounts(societyId, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        penaltyService.delete(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
