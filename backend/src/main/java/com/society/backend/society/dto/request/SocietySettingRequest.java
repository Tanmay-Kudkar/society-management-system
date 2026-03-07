package com.society.backend.society.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SocietySettingRequest {
    private BigDecimal maintenanceRatePerSqft;
    private BigDecimal waterChargesFixed;
    private BigDecimal waterChargesPerPerson;
    private BigDecimal sinkingFundPerSqft;
    private BigDecimal repairFundPerSqft;
    private BigDecimal parkingChargeOpen;
    private BigDecimal parkingChargeCovered;
    private BigDecimal parkingChargeStilt;
    private BigDecimal parkingChargeTwoWheeler;
    private BigDecimal liftMaintenanceCharge;
    private BigDecimal electricityCommonCharge;
    private BigDecimal securityCharge;
    private BigDecimal insuranceCharge;
    private BigDecimal clubHouseCharge;
    private BigDecimal propertyTaxShare;
    private BigDecimal nonOccupancySurchargePct;
    private BigDecimal gstPercentage;
    private BigDecimal latePaymentInterestPct;

    @Min(value = 0, message = "Grace period cannot be negative")
    private Integer gracePeriodDays;

    private BigDecimal penaltyFixed;

    @Min(value = 1, message = "Bill generation day must be between 1 and 31")
    @Max(value = 31, message = "Bill generation day must be between 1 and 31")
    private Integer billGenerationDay;

    @Min(value = 1, message = "Due date day must be between 1 and 31")
    @Max(value = 31, message = "Due date day must be between 1 and 31")
    private Integer dueDateDay;

    @Min(value = 1, message = "Financial year month must be between 1 and 12")
    @Max(value = 12, message = "Financial year month must be between 1 and 12")
    private Integer financialYearStartMonth;

    private String billNumberPrefix;
    private String receiptNumberPrefix;
}