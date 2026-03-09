package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.society.entity.Society;
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
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "Alternate phone is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String alternatePhone;

    @NotBlank(message = "Address is required")
    private String address;
    private String notes;
}
