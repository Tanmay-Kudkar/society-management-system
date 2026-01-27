package com.society.backend.dto.tenant;

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
