package com.society.backend.controller;

import com.society.backend.dto.ContractRequest;
import com.society.backend.dto.ContractResponse;
import com.society.backend.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @PostMapping
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
    public ResponseEntity<ContractResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ContractRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contractService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ContractResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contractService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        contractService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
