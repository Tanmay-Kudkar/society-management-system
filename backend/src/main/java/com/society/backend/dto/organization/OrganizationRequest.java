package com.society.backend.dto.organization;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrganizationRequest {

    @NotBlank(message = "Organization name is required")
    private String name;

    @NotBlank(message = "Owner name is required")
    private String ownerName;

    @NotBlank(message = "Owner email is required")
    @Email(message = "Invalid owner email format")
    private String ownerEmail;

    @NotBlank(message = "Owner phone is required")
    @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Invalid owner phone format")
    private String ownerPhone;

    /** Password for the ORGANIZATION_OWNER user (only used on create) */
    private String ownerPassword;

    private String subscriptionType; // FREE, BASIC, PREMIUM, LIFETIME
    private Integer maxSocieties;
}
