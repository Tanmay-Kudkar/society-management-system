package com.society.backend.dto.society;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for a society rate configuration entry.
 */
@Getter
@Setter
public class SocietyRateConfigResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String chargeType;
    private String description;
    private BigDecimal amount;
    private String applicableTo;
    private Boolean isPerSqft;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
