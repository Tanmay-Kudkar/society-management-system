package com.society.backend.flat.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class TenantResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private Long userId;
    private String userName;
    private String name;
    private String phone;
    private String email;
    private java.math.BigDecimal rentAmount;
    private java.math.BigDecimal depositAmount;
    private String idProofType;
    private String idProofNumber;
    private LocalDate agreementStartDate;
    private LocalDate agreementEndDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
