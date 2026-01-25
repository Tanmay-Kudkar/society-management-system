package com.society.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class BannerRequest {
    private Long societyId; // null for global banners

    @NotBlank(message = "Title is required")
    private String title;

    private String imageUrl;
    private String redirectUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer displayOrder;
}
