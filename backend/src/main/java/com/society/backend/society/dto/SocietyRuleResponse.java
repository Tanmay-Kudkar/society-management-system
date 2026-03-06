package com.society.backend.society.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class SocietyRuleResponse {
    private Long id;
    private Long societyId;
    private Long createdById;
    private String createdByName;
    private String title;
    private String category;
    private String description;
    private String content;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
    private String version;
    private Boolean isActive;
    private Boolean isMandatory;
    private String attachmentUrl;
    private Integer sortOrder;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
