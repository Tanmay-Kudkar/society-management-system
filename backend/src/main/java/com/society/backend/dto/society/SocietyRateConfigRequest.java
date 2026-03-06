package com.society.backend.dto.society;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request DTO for creating/updating a society rate configuration.
 * F08 — Society Rate Configuration
 */
@Getter
@Setter
public class SocietyRateConfigRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Charge type is required")
    private String chargeType;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    /** ALL, FLAT, SHOP, OFFICE */
    private String applicableTo;

    /** Whether the amount is per sqft */
    private Boolean isPerSqft;

    private Integer displayOrder;

    private Boolean isActive;
}
