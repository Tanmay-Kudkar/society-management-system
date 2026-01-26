package com.society.backend.dto.complaint;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
}
