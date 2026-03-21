package com.society.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeIdProofMetadataRequest {

    @NotBlank(message = "Storage provider is required")
    private String storageProvider;

    private String bucketName;

    @NotBlank(message = "Object key is required")
    private String objectKey;

    private String fileName;
    private String contentType;
    private String checksum;
    private Long fileSize;
    private String documentUrl;
}
