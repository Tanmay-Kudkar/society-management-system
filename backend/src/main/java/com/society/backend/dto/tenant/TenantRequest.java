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

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "ID proof type is required")
    private String idProofType;

    @NotBlank(message = "ID proof number is required")
    private String idProofNumber;

    @NotNull(message = "Agreement start date is required")
    private LocalDate agreementStartDate;

    @NotNull(message = "Agreement end date is required")
    private LocalDate agreementEndDate;

    @NotNull(message = "Rent amount is required")
    private java.math.BigDecimal rentAmount;

    @NotNull(message = "Deposit amount is required")
    private java.math.BigDecimal depositAmount;
}
