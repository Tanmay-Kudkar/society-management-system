package com.society.backend.service;

import com.society.backend.dto.DocumentTemplateRequest;
import com.society.backend.dto.DocumentTemplateResponse;

import java.util.List;
import java.util.Map;

public interface DocumentTemplateService {
    DocumentTemplateResponse create(DocumentTemplateRequest request, Long userId);

    DocumentTemplateResponse getById(Long id);

    List<DocumentTemplateResponse> getByTemplateType(String templateType);

    List<DocumentTemplateResponse> getAll();

    DocumentTemplateResponse update(Long id, DocumentTemplateRequest request, Long userId);

    DocumentTemplateResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId);

    // Generate document from template with placeholders replaced
    String generateDocument(Long templateId, Map<String, String> placeholders);
}
