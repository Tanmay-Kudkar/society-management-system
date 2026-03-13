package com.society.backend.user.controller;

import com.society.backend.user.dto.request.EmployeeRequest;
import com.society.backend.user.dto.response.EmployeeResponse;
import com.society.backend.user.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> create(
            @Valid @RequestBody EmployeeRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.getById(id, userId));
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<EmployeeResponse> getByUserId(
            @PathVariable Long targetUserId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.getByUserId(targetUserId, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<EmployeeResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.getBySociety(societyId, department, isActive,
                PageRequest.of(page, size, Sort.by("createdAt").descending()), userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.getCounts(societyId, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        employeeService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/advance/record")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<EmployeeResponse> recordAdvance(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.recordAdvancePayment(id, amount, userId));
    }

    @PatchMapping("/{id}/advance/deduct")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<EmployeeResponse> deductAdvance(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.deductAdvance(id, amount, userId));
    }
}
