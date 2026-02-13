package com.society.backend.dto.notice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class NoticeRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotBlank(message = "Priority is required")
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    private LocalDate expiryDate;
}
