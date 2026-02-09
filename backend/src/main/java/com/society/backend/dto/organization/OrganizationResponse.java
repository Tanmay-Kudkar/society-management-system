package com.society.backend.dto.organization;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationResponse {
    private Long id;
    private String name;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String subscriptionType;
    private String subscriptionStatus;
    private LocalDate subscriptionStartDate;
    private LocalDate subscriptionEndDate;
    private Integer maxSocieties;
    private Boolean isFoundingMember;
    private Boolean isActive;
    private Long societyCount;
}
