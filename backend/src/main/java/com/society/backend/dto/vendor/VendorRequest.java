package com.society.backend.dto.vendor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Vendor name is required")
    private String name;

    @NotBlank(message = "Service type is required")
    private String serviceType;

    @NotBlank(message = "Contact person name is required")
    private String contactPerson;

    @NotBlank(message = "Contact person phone is required")
    private String contactPersonPhone;

    @NotBlank(message = "Contact person email is required")
    @Email(message = "Invalid contact person email format")
    private String contactPersonEmail;

    @NotBlank(message = "Vendor phone is required")
    private String phone;

    @NotBlank(message = "Vendor email is required")
    @Email(message = "Invalid vendor email format")
    private String email;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "GST number is required")
    private String gstNumber;

    @NotBlank(message = "PAN number is required")
    private String panNumber;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    private String ifscCode;
}
