package com.society.backend.dto.vendor;

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

    private String contactPerson;
    private String contactPersonPhone;

    @Email(message = "Invalid contact person email format")
    private String contactPersonEmail;

    @NotBlank(message = "Vendor phone is required")
    private String phone;

    @Email(message = "Invalid vendor email format")
    private String email;

    private String address;
    private String gstNumber;
    private String panNumber;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
}
