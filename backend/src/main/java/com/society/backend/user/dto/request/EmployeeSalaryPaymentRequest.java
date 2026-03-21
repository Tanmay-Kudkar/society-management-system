package com.society.backend.user.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class EmployeeSalaryPaymentRequest {

    @NotNull(message = "Salary month is required")
    private LocalDate salaryMonth;

    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base salary must be greater than zero")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.0", inclusive = true, message = "Deduction cannot be negative")
    private BigDecimal deductionAmount;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String paymentMode;
    private String referenceNumber;
    private String deductionReason;
    private String notes;
}
