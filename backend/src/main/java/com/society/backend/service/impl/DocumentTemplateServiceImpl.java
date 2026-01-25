package com.society.backend.service.impl;

import com.society.backend.dto.DocumentTemplateRequest;
import com.society.backend.dto.DocumentTemplateResponse;
import com.society.backend.entity.DocumentTemplate;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.DocumentTemplateRepository;
import com.society.backend.service.DocumentTemplateService;
import com.society.backend.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentTemplateServiceImpl implements DocumentTemplateService {

    private final DocumentTemplateRepository documentTemplateRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public DocumentTemplateResponse create(DocumentTemplateRequest request, Long userId) {
        roleService.requireMasterAdmin(userId);

        DocumentTemplate template = new DocumentTemplate();
        template.setTemplateType(request.getTemplateType());
        template.setTitle(request.getTitle());
        template.setContent(request.getContent());
        template.setIsActive(true);

        DocumentTemplate saved = documentTemplateRepository.save(template);
        return mapToResponse(saved);
    }

    @Override
    public DocumentTemplateResponse getById(Long id) {
        DocumentTemplate template = documentTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document template not found"));
        return mapToResponse(template);
    }

    @Override
    public List<DocumentTemplateResponse> getByTemplateType(String templateType) {
        return documentTemplateRepository.findByTemplateType(templateType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DocumentTemplateResponse> getAll() {
        return documentTemplateRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DocumentTemplateResponse update(Long id, DocumentTemplateRequest request, Long userId) {
        roleService.requireMasterAdmin(userId);

        DocumentTemplate template = documentTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document template not found"));

        if (request.getTemplateType() != null)
            template.setTemplateType(request.getTemplateType());
        if (request.getTitle() != null)
            template.setTitle(request.getTitle());
        if (request.getContent() != null)
            template.setContent(request.getContent());

        DocumentTemplate saved = documentTemplateRepository.save(template);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DocumentTemplateResponse deactivate(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        DocumentTemplate template = documentTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document template not found"));

        template.setIsActive(false);
        DocumentTemplate saved = documentTemplateRepository.save(template);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        if (!documentTemplateRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document template not found");
        }
        documentTemplateRepository.deleteById(id);
    }

    @Override
    public String generateDocument(Long templateId, Map<String, String> placeholders) {
        DocumentTemplate template = documentTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document template not found"));

        String content = template.getContent();

        // Replace placeholders like {{ownerName}}, {{flatNumber}}, etc.
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }

        return content;
    }

    private DocumentTemplateResponse mapToResponse(DocumentTemplate template) {
        DocumentTemplateResponse response = new DocumentTemplateResponse();
        response.setId(template.getId());
        response.setTemplateType(template.getTemplateType());
        response.setTitle(template.getTitle());
        response.setContent(template.getContent());
        response.setIsActive(template.getIsActive());
        response.setCreatedAt(template.getCreatedAt());
        response.setUpdatedAt(template.getUpdatedAt());
        return response;
    }
}
