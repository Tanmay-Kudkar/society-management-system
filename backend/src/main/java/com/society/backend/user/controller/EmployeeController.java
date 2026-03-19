package com.society.backend.user.controller;

import com.society.backend.user.dto.request.EmployeeRequest;
import com.society.backend.user.dto.request.EmployeeIdProofMetadataRequest;
import com.society.backend.user.dto.response.EmployeeIdProofDocumentPayload;
import com.society.backend.user.dto.response.EmployeeIdProofMetadataResponse;
import com.society.backend.user.dto.response.EmployeeResponse;
import com.society.backend.user.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> create(
            @Valid @RequestBody EmployeeRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
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
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        employeeService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/advance/record")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> recordAdvance(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.recordAdvancePayment(id, amount, userId));
    }

    @PatchMapping("/{id}/advance/deduct")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> deductAdvance(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.deductAdvance(id, amount, userId));
    }

    @PutMapping("/{id}/id-proof/metadata")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeIdProofMetadataResponse> updateIdProofMetadata(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeIdProofMetadataRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.updateIdProofMetadata(id, request, userId));
    }

    @GetMapping("/{id}/id-proof/metadata")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeIdProofMetadataResponse> getIdProofMetadata(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.getIdProofMetadata(id, userId));
    }

    @PostMapping(path = "/{id}/id-proof/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<EmployeeIdProofMetadataResponse> uploadIdProofDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String idProofType,
            @RequestParam(required = false) String idProofNumber,
            @RequestParam Long userId) {
        return ResponseEntity.ok(employeeService.uploadIdProofDocument(id, file, idProofType, idProofNumber, userId));
    }

    @GetMapping("/{id}/id-proof/file")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER')")
    public ResponseEntity<ByteArrayResource> downloadIdProofDocument(
            @PathVariable Long id,
            @RequestParam Long userId) {
        EmployeeIdProofDocumentPayload payload = employeeService.downloadIdProofDocument(id, userId);
        ByteArrayResource resource = new ByteArrayResource(payload.getContent());
        String safeFileName = payload.getFileName() != null ? payload.getFileName().replaceAll("[\\r\\n\"]", "_") : "id-proof.bin";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName + "\"")
                .contentType(MediaType.parseMediaType(payload.getContentType() != null ? payload.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .contentLength(payload.getContent().length)
                .body(resource);
    }
}
