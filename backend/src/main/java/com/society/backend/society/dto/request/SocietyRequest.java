package com.society.backend.society.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.society.entity.Society;
@Getter
@Setter
public class SocietyRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode;

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Society email is required")
    @Email(message = "Invalid society email format")
    private String email;

    @NotBlank(message = "Telephone is required")
    @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Invalid telephone format")
    private String telephone;

    // Total capacity for units
    @NotNull(message = "Total flats is required")
    @Min(value = 0, message = "Total flats cannot be negative")
    private Integer totalFlats;

    @NotNull(message = "Total shops is required")
    @Min(value = 0, message = "Total shops cannot be negative")
    private Integer totalShops;

    @NotNull(message = "Total offices is required")
    @Min(value = 0, message = "Total offices cannot be negative")
    private Integer totalOffices;

    @NotNull(message = "Total wings is required")
    @Min(value = 0, message = "Total wings cannot be negative")
    private Integer totalWings;

    @Min(value = 0, message = "Parking capacity cannot be negative")
    private Integer twoWheelerParkingCapacity;

    @Min(value = 0, message = "Parking capacity cannot be negative")
    private Integer fourWheelerParkingCapacity;
}
