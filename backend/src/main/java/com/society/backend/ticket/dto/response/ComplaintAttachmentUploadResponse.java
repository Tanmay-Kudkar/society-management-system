package com.society.backend.ticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintAttachmentUploadResponse {
    private Long id;
    private String fileName;
    private String contentType;
    private Long size;
    private String url;
}
