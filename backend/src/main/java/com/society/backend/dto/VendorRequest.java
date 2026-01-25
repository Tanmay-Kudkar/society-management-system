package com.society.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorRequest {
    private Long societyId;

    @NotBlank(message = "Vendor name is required")
    private String name;

    @NotBlank(message = "Service type is required")
    private String serviceType;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private String address;
    private String gstNumber;
    private String panNumber;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private Boolean isCommon; // true if vendor serves multiple societies
}
