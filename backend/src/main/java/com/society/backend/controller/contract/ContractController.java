package com.society.backend.controller.contract;

import com.society.backend.dto.contract.ContractRequest;
import com.society.backend.dto.contract.ContractResponse;
import com.society.backend.service.contract.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<ContractResponse> create(
            @Valid @RequestBody ContractRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<ContractResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(contractService.getBySocietyId(societyId));
    }

    @GetMapping("/type/{contractType}")
    public ResponseEntity<List<ContractResponse>> getByContractType(@PathVariable String contractType) {
        return ResponseEntity.ok(contractService.getByContractType(contractType));
    }

    @GetMapping("/expiring/{societyId}")
    public ResponseEntity<List<ContractResponse>> getExpiringSoon(
            @PathVariable Long societyId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(contractService.getExpiringSoon(societyId, days));
    }

    @GetMapping
    public ResponseEntity<List<ContractResponse>> getAll() {
        return ResponseEntity.ok(contractService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<ContractResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ContractRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contractService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<ContractResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contractService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        contractService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
