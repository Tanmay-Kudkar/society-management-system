package com.society.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PetRegistrationRequest {

    @NotNull
    private Long societyId;

    @NotNull
    private Long ownerId;

    private String flatNumber;
    private String wing;

    @NotBlank
    private String petName;

    @NotBlank
    private String petType;

    private String breed;
    private String color;
    private Integer ageYears;
    private String gender;
    private BigDecimal weightKg;
    private Boolean vaccinated;
    private LocalDate vaccinationDate;
    private LocalDate vaccinationExpiry;
    private String registrationNumber;
    private String microchipId;
    private String photoUrl;
    private String specialNotes;
}
