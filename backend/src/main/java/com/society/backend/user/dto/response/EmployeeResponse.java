package com.society.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class EmployeeResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private Long societyId;
    private String societyName;

    // Employment
    private String employeeCode;
    private String department;
    private String designation;
    private LocalDate joiningDate;
    private LocalDate terminationDate;
    private String employmentType;
    private String shiftTiming;

    // Salary
    private BigDecimal monthlySalary;
    private String salaryAccountNumber;
    private String salaryIfsc;
    private String salaryBankName;

    // Identity
    private String idProofType;
    private String idProofNumber;
    private String idProofDocumentUrl;
    private String photoUrl;

    // Emergency
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String address;

    // Advance
    private BigDecimal advanceBalance;

    // Status
    private Boolean isActive;
    private String notes;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
