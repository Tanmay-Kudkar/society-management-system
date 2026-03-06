package com.society.backend.flat.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class PetRegistrationResponse {
    private Long id;
    private Long societyId;
    private Long ownerId;
    private String ownerName;
    private String flatNumber;
    private String wing;
    private String petName;
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
    private String status;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
