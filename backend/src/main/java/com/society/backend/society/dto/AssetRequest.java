package com.society.backend.society.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AssetRequest {
    @NotBlank
    private String assetName;
    private String assetCode;
    @NotBlank
    private String category;
    private String description;
    private String location;
    private String condition;
    @NotNull
    private Long societyId;
    private Long assignedToId;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private BigDecimal currentValue;
    private LocalDate warrantyExpiry;
    private String vendorName;
    private Integer quantity;
    private Integer minQuantity;
    private String notes;
}
