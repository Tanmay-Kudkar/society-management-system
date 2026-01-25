package com.society.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoticeRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String message;
}
