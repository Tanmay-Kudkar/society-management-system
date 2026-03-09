package com.society.backend.society.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SocietySettingRequest {
    @DecimalMin(value = "0", message = "Maintenance rate cannot be negative")
    private BigDecimal maintenanceRatePerSqft;
    @DecimalMin(value = "0", message = "Water charges cannot be negative")
    private BigDecimal waterChargesFixed;
    @DecimalMin(value = "0", message = "Water charges cannot be negative")
    private BigDecimal waterChargesPerPerson;
    @DecimalMin(value = "0", message = "Sinking fund cannot be negative")
    private BigDecimal sinkingFundPerSqft;
    @DecimalMin(value = "0", message = "Repair fund cannot be negative")
    private BigDecimal repairFundPerSqft;
    @DecimalMin(value = "0", message = "Parking charge cannot be negative")
    private BigDecimal parkingChargeOpen;
    @DecimalMin(value = "0", message = "Parking charge cannot be negative")
    private BigDecimal parkingChargeCovered;
    @DecimalMin(value = "0", message = "Parking charge cannot be negative")
    private BigDecimal parkingChargeStilt;
    @DecimalMin(value = "0", message = "Parking charge cannot be negative")
    private BigDecimal parkingChargeTwoWheeler;
    @DecimalMin(value = "0", message = "Lift maintenance charge cannot be negative")
    private BigDecimal liftMaintenanceCharge;
    @DecimalMin(value = "0", message = "Electricity charge cannot be negative")
    private BigDecimal electricityCommonCharge;
    @DecimalMin(value = "0", message = "Security charge cannot be negative")
    private BigDecimal securityCharge;
    @DecimalMin(value = "0", message = "Insurance charge cannot be negative")
    private BigDecimal insuranceCharge;
    @DecimalMin(value = "0", message = "Club house charge cannot be negative")
    private BigDecimal clubHouseCharge;
    @DecimalMin(value = "0", message = "Property tax share cannot be negative")
    private BigDecimal propertyTaxShare;
    @DecimalMin(value = "0", message = "Surcharge percentage cannot be negative")
    private BigDecimal nonOccupancySurchargePct;
    @DecimalMin(value = "0", message = "GST percentage cannot be negative")
    private BigDecimal gstPercentage;
    @DecimalMin(value = "0", message = "Interest percentage cannot be negative")
    private BigDecimal latePaymentInterestPct;

    @Min(value = 0, message = "Grace period cannot be negative")
    private Integer gracePeriodDays;

    @DecimalMin(value = "0", message = "Penalty amount cannot be negative")
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