package com.society.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class BannerResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String title;
    private String imageUrl;
    private String redirectUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
