package com.society.backend.notification.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.society.backend.flat.entity.Wing;
@Getter
@Builder
public class ClassifiedResponse {
    private Long id;
    private Long societyId;
    private Long postedById;
    private String postedByName;
    private String flatNumber;
    private String wing;
    private String title;
    private String description;
    private String category;
    private String listingType;
    private BigDecimal price;
    private Boolean negotiable;
    private String itemCondition;
    private String imageUrls;
    private String contactPhone;
    private String contactEmail;
    private String status;
    private LocalDateTime expiresAt;
    private Boolean flagged;
    private String flagReason;
    private Integer views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
