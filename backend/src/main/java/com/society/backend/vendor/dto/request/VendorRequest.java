package com.society.backend.vendor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.society.entity.Society;
import com.society.backend.vendor.entity.Vendor;
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
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String contactPersonPhone;

    @NotBlank(message = "Contact person email is required")
    @Email(message = "Invalid contact person email format")
    private String contactPersonEmail;

    @NotBlank(message = "Vendor phone is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "Vendor email is required")
    @Email(message = "Invalid vendor email format")
    private String email;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "GST number is required")
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", message = "Invalid GST number format")
    private String gstNumber;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN number format")
    private String panNumber;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account number is required")
    @Size(min = 8, max = 18, message = "Account number must be 8-18 digits")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;
}
