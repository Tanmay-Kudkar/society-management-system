package com.society.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmergencyContactRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Contact type is required")
    private String contactType; // DOCTOR, PLUMBER, ELECTRICIAN, POLICE, FIRE, AMBULANCE, etc.

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String alternatePhone;
    private String address;
    private String notes;
}
