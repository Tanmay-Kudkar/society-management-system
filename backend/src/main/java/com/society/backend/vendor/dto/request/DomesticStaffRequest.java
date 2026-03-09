package com.society.backend.vendor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DomesticStaffRequest {

    @NotBlank(message = "Staff name is required")
    private String name;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "Staff type is required")
    private String staffType;

    private String idProofType;
    private String idProofNumber;
    private Long societyId;
    private String address;
}
