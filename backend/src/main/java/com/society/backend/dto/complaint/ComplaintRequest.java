package com.society.backend.dto.complaint;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintRequest {

    private Long societyId;

    @NotBlank(message = "Subject is required")
    private String subject;

    private String description;

    private String category;
}
