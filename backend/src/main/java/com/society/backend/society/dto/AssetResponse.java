package com.society.backend.society.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class AssetResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String assetName;
    private String assetCode;
    private String category;
    private String description;
    private String location;
    private String status;
    private String condition;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private BigDecimal currentValue;
    private LocalDate warrantyExpiry;
    private String vendorName;
    private Long assignedToId;
    private String assignedToName;
    private Integer quantity;
    private Integer minQuantity;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
