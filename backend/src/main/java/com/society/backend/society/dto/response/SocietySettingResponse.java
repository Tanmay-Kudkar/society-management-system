package com.society.backend.society.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class SocietySettingResponse {
    private Long id;
    private Long societyId;
    private String societyName;

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
    private Integer gracePeriodDays;
    private BigDecimal penaltyFixed;
    private Integer billGenerationDay;
    private Integer dueDateDay;
    private Integer financialYearStartMonth;
    private String billNumberPrefix;
    private String receiptNumberPrefix;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}