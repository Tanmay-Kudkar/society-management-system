package com.society.backend.notice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class BannerRequest {
    private Long societyId; // null for global banners

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;
    private String redirectUrl;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Display order is required")
    private Integer displayOrder;

    @NotNull(message = "Banner status is required")
    private Boolean isActive;
}
