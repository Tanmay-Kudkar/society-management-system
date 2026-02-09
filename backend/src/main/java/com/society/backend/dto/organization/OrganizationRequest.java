package com.society.backend.dto.organization;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrganizationRequest {

    @NotBlank(message = "Organization name is required")
    private String name;

    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    private String subscriptionType; // FREE, BASIC, PREMIUM, LIFETIME
    private Integer maxSocieties;
    private Boolean isFoundingMember;
}
