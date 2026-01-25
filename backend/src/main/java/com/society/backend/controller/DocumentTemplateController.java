package com.society.backend.controller;

import com.society.backend.dto.DocumentTemplateRequest;
import com.society.backend.dto.DocumentTemplateResponse;
import com.society.backend.service.DocumentTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/document-templates")
@RequiredArgsConstructor
public class DocumentTemplateController {

    private final DocumentTemplateService documentTemplateService;

    @PostMapping
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
    public ResponseEntity<DocumentTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DocumentTemplateRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(documentTemplateService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<DocumentTemplateResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(documentTemplateService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
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
