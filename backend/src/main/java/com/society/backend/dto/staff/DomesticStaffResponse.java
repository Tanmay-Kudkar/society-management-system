package com.society.backend.dto.staff;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class DomesticStaffResponse {
    private Long id;
    private String name;
    private String phone;
    private String staffType;
    private String idProofType;
    private String idProofNumber;
    private Long societyId;
    private String societyName;
    private String address;
    private Double rating;
    private Boolean isActive;
    private Boolean isVerified;
    private LocalDateTime createdAt;
}
