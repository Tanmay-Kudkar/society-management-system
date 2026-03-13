package com.society.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class EmployeeRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Society ID is required")
    private Long societyId;

    private String employeeCode;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Designation is required")
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

    private String notes;
}
