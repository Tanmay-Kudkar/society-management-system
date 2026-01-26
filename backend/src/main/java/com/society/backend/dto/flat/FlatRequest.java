package com.society.backend.dto.flat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class FlatRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    private String flatType; // 1BHK, 2BHK, 3BHK, etc.

    private Integer floor;

    private BigDecimal area; // in sq ft

    private String ownerName;

    private String ownerEmail;

    private String ownerPhone;
}
