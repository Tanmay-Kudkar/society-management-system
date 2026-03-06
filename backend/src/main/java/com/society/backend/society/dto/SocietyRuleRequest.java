package com.society.backend.society.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SocietyRuleRequest {

    @NotNull
    private Long societyId;

    @NotBlank
    private String title;

    @NotBlank
    private String category;

    private String description;

    @NotBlank
    private String content;

    private LocalDate effectiveDate;
    private LocalDate expiryDate;
    private String version;
    private Boolean isActive;
    private Boolean isMandatory;
    private String attachmentUrl;
    private Integer sortOrder;
}
