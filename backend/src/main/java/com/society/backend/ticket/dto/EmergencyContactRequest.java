package com.society.backend.ticket.dto;

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

    @NotBlank(message = "Alternate phone is required")
    private String alternatePhone;

    @NotBlank(message = "Address is required")
    private String address;
    private String notes;
}
