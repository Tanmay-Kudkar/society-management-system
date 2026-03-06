package com.society.backend.notice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ClassifiedRequest {

    @NotNull
    private Long societyId;

    @NotNull
    private Long postedById;

    private String flatNumber;
    private String wing;

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String category;

    @NotBlank
    private String listingType;

    private BigDecimal price;
    private Boolean negotiable;
    private String itemCondition;
    private String imageUrls;
    private String contactPhone;
    private String contactEmail;
    private LocalDateTime expiresAt;
}
