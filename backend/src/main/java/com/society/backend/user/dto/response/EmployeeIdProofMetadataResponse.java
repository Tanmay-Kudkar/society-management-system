package com.society.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class EmployeeIdProofMetadataResponse {

    private String storageProvider;
    private String bucketName;
    private String objectKey;
    private String fileName;
    private String contentType;
    private String checksum;
    private Long fileSize;
    private String documentUrl;
    private String metadataVersion;
    private String metadataUpdatedAt;
}
