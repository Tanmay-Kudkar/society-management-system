package com.society.backend.dto.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TenantRequest {
    @NotNull(message = "Flat ID is required")
    private Long flatId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private String idProofType;
    private String idProofNumber;
    private LocalDate agreementStartDate;
    private LocalDate agreementEndDate;
    private java.math.BigDecimal rentAmount;
    private java.math.BigDecimal depositAmount;
}
