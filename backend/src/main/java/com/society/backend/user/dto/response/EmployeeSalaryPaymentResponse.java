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
public class EmployeeSalaryPaymentResponse {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private Long employeeUserId;
    private String employeeName;
    private Long societyId;
    private LocalDate salaryMonth;
    private BigDecimal baseSalary;
    private BigDecimal deductionAmount;
    private BigDecimal netPaid;
    private LocalDate paymentDate;
    private String paymentMode;
    private String referenceNumber;
    private String deductionReason;
    private String notes;
    private Long recordedById;
    private String recordedByName;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
