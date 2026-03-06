package com.society.backend.flat.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantImportRow {
    private int rowNumber;
    private String flatNumber;
    private String name;
    private String phone;
    private String email;
    private String agreementStartDate; // yyyy-MM-dd
    private String agreementEndDate; // yyyy-MM-dd
    private Double rentAmount;
    private Double depositAmount;
    private String idProofType;
    private String idProofNumber;

    private boolean valid = true;
    private String errorMessage;
}
