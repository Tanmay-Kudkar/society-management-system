package com.society.backend.dto.society;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocietyRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String registrationNumber;

    private String email;

    private String telephone;

    // Total capacity for units
    private Integer totalFlats;

    private Integer totalShops;

    private Integer totalOffices;

    private Integer totalWings;

    // Organization ID (for societies created under an organization)
    private Long organizationId;
}
