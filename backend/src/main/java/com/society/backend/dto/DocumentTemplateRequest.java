package com.society.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentTemplateRequest {
    @NotBlank(message = "Template type is required")
    private String templateType; // NOC, LETTER, MEETING_AGENDA, RESOLUTION, etc.

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content; // Template with placeholders like {{ownerName}}, {{flatNumber}}, etc.
}
