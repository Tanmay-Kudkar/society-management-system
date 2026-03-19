package com.society.backend.user.controller;

import com.society.backend.user.dto.request.EmployeeSalaryPaymentRequest;
import com.society.backend.user.dto.response.EmployeeSalaryPaymentResponse;
import com.society.backend.user.service.EmployeeSalaryPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/employee-salary-payments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmployeeSalaryPaymentController {

    private final EmployeeSalaryPaymentService employeeSalaryPaymentService;

    @PostMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeSalaryPaymentResponse> recordPayment(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeSalaryPaymentRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeSalaryPaymentService.recordPayment(employeeId, request, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<EmployeeSalaryPaymentResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromMonth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toMonth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeSalaryPaymentService.getBySociety(
                societyId,
                fromMonth,
                toMonth,
                PageRequest.of(page, size, Sort.by("salaryMonth").descending()),
                userId
        ));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeSalaryPaymentResponse>> getByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromMonth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toMonth,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeSalaryPaymentService.getByEmployee(employeeId, fromMonth, toMonth, userId));
    }
}
