package com.society.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class EmployeeIdProofDocumentPayload {

    private String fileName;
    private String contentType;
    private byte[] content;
}
