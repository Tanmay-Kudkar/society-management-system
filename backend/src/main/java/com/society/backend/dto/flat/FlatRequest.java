package com.society.backend.dto.flat;

import jakarta.validation.constraints.Email;
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

    private Long wingId; // Optional - can be null if no wing

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    @NotBlank(message = "Unit type is required")
    private String unitType; // FLAT, SHOP, OFFICE

    @NotBlank(message = "Unit configuration/type is required")
    private String flatType; // 1BHK, 2BHK, 3BHK, etc.

    @NotNull(message = "Floor is required")
    private Integer floor;

    @NotNull(message = "Area is required")
    private BigDecimal area; // in sq ft

    private String ownerName;

    @Email(message = "Invalid owner email format")
    private String ownerEmail;

    private String ownerPhone;
}
