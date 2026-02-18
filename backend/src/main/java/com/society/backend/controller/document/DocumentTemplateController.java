package com.society.backend.controller.document;

import com.society.backend.dto.document.DocumentTemplateRequest;
import com.society.backend.dto.document.DocumentTemplateResponse;
import com.society.backend.service.document.DocumentTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/document-templates")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DocumentTemplateController {

    private final DocumentTemplateService documentTemplateService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<DocumentTemplateResponse> create(
            @Valid @RequestBody DocumentTemplateRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentTemplateService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentTemplateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(documentTemplateService.getById(id));
    }

    @GetMapping("/type/{templateType}")
    public ResponseEntity<List<DocumentTemplateResponse>> getByTemplateType(@PathVariable String templateType) {
        return ResponseEntity.ok(documentTemplateService.getByTemplateType(templateType));
    }

    @GetMapping
    public ResponseEntity<List<DocumentTemplateResponse>> getAll() {
        return ResponseEntity.ok(documentTemplateService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<DocumentTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DocumentTemplateRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(documentTemplateService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<DocumentTemplateResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(documentTemplateService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        documentTemplateService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<String> generateDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> placeholders) {
        return ResponseEntity.ok(documentTemplateService.generateDocument(id, placeholders));
    }
}
