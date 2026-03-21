package com.society.backend.common.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.society.backend.common.exception.ApiException;
import com.society.backend.common.security.DocumentMetadataCryptoService;
import com.society.backend.user.dto.request.EmployeeIdProofMetadataRequest;
import com.society.backend.user.dto.response.EmployeeIdProofMetadataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SecureDocumentMetadataService {

    private final ObjectMapper objectMapper;
    private final DocumentMetadataCryptoService cryptoService;

    public EncryptedPayload encrypt(EmployeeIdProofMetadataRequest request) {
        try {
            MetadataEnvelope envelope = new MetadataEnvelope(
                    request.getStorageProvider(),
                    request.getBucketName(),
                    request.getObjectKey(),
                    request.getFileName(),
                    request.getContentType(),
                    request.getChecksum(),
                    request.getFileSize(),
                    request.getDocumentUrl(),
                    LocalDateTime.now().toString()
            );
            String json = objectMapper.writeValueAsString(envelope);
            String encrypted = cryptoService.encrypt(json);
            return new EncryptedPayload(encrypted, cryptoService.currentVersion());
        } catch (JsonProcessingException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid metadata payload");
        }
    }

    public EmployeeIdProofMetadataResponse decrypt(String encryptedPayload, String version) {
        if (encryptedPayload == null || encryptedPayload.isBlank()) {
            return null;
        }
        try {
            String json = cryptoService.decrypt(encryptedPayload);
            MetadataEnvelope envelope = objectMapper.readValue(json, MetadataEnvelope.class);
            return EmployeeIdProofMetadataResponse.builder()
                    .storageProvider(envelope.storageProvider)
                    .bucketName(envelope.bucketName)
                    .objectKey(envelope.objectKey)
                    .fileName(envelope.fileName)
                    .contentType(envelope.contentType)
                    .checksum(envelope.checksum)
                    .fileSize(envelope.fileSize)
                    .documentUrl(envelope.documentUrl)
                    .metadataVersion(version)
                    .metadataUpdatedAt(envelope.metadataUpdatedAt)
                    .build();
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to parse encrypted metadata");
        }
    }

    public record EncryptedPayload(String encryptedPayload, String version) {}

    private static final class MetadataEnvelope {
        public String storageProvider;
        public String bucketName;
        public String objectKey;
        public String fileName;
        public String contentType;
        public String checksum;
        public Long fileSize;
        public String documentUrl;
        public String metadataUpdatedAt;

        public MetadataEnvelope() {
        }

        public MetadataEnvelope(String storageProvider,
                                String bucketName,
                                String objectKey,
                                String fileName,
                                String contentType,
                                String checksum,
                                Long fileSize,
                                String documentUrl,
                                String metadataUpdatedAt) {
            this.storageProvider = storageProvider;
            this.bucketName = bucketName;
            this.objectKey = objectKey;
            this.fileName = fileName;
            this.contentType = contentType;
            this.checksum = checksum;
            this.fileSize = fileSize;
            this.documentUrl = documentUrl;
            this.metadataUpdatedAt = metadataUpdatedAt;
        }
    }
}
