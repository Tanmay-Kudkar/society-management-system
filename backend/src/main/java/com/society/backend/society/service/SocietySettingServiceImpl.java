package com.society.backend.society.service;

import com.society.backend.society.dto.request.SocietySettingRequest;
import com.society.backend.society.dto.response.SocietySettingResponse;
import com.society.backend.society.entity.Society;
import com.society.backend.society.entity.SocietySetting;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.society.repository.SocietySettingRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class SocietySettingServiceImpl implements SocietySettingService {

    private final SocietySettingRepository societySettingRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public SocietySettingServiceImpl(
            SocietySettingRepository societySettingRepository,
            SocietyRepository societyRepository,
            RoleService roleService) {
        this.societySettingRepository = societySettingRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    @Transactional
    public SocietySettingResponse getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return toResponse(getOrCreateDefaultSetting(societyId));
    }

    @Override
    @Transactional
    public SocietySettingResponse upsertBySocietyId(Long societyId, SocietySettingRequest request) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);

        SocietySetting setting = getOrCreateDefaultSetting(societyId);
        applyRequest(setting, request);

        SocietySetting saved = societySettingRepository.save(setting);
        return toResponse(saved);
    }

    private SocietySetting getOrCreateDefaultSetting(Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        return societySettingRepository.findBySocietyId(societyId)
                .orElseGet(() -> {
                    SocietySetting defaults = new SocietySetting();
                    defaults.setSociety(society);
                    defaults.setBillNumberPrefix("BILL");
                    defaults.setReceiptNumberPrefix("RCT");
                    defaults.setGracePeriodDays(5);
                    defaults.setBillGenerationDay(1);
                    defaults.setDueDateDay(10);
                    defaults.setFinancialYearStartMonth(4);
                    return societySettingRepository.save(defaults);
                });
    }

    private void applyRequest(SocietySetting setting, SocietySettingRequest request) {
        if (request.getMaintenanceRatePerSqft() != null)
            setting.setMaintenanceRatePerSqft(nonNegative(request.getMaintenanceRatePerSqft(), "maintenanceRatePerSqft"));
        if (request.getWaterChargesFixed() != null)
            setting.setWaterChargesFixed(nonNegative(request.getWaterChargesFixed(), "waterChargesFixed"));
        if (request.getWaterChargesPerPerson() != null)
            setting.setWaterChargesPerPerson(nonNegative(request.getWaterChargesPerPerson(), "waterChargesPerPerson"));
        if (request.getSinkingFundPerSqft() != null)
            setting.setSinkingFundPerSqft(nonNegative(request.getSinkingFundPerSqft(), "sinkingFundPerSqft"));
        if (request.getRepairFundPerSqft() != null)
            setting.setRepairFundPerSqft(nonNegative(request.getRepairFundPerSqft(), "repairFundPerSqft"));
        if (request.getParkingChargeOpen() != null)
            setting.setParkingChargeOpen(nonNegative(request.getParkingChargeOpen(), "parkingChargeOpen"));
        if (request.getParkingChargeCovered() != null)
            setting.setParkingChargeCovered(nonNegative(request.getParkingChargeCovered(), "parkingChargeCovered"));
        if (request.getParkingChargeStilt() != null)
            setting.setParkingChargeStilt(nonNegative(request.getParkingChargeStilt(), "parkingChargeStilt"));
        if (request.getParkingChargeTwoWheeler() != null)
            setting.setParkingChargeTwoWheeler(nonNegative(request.getParkingChargeTwoWheeler(), "parkingChargeTwoWheeler"));
        if (request.getLiftMaintenanceCharge() != null)
            setting.setLiftMaintenanceCharge(nonNegative(request.getLiftMaintenanceCharge(), "liftMaintenanceCharge"));
        if (request.getElectricityCommonCharge() != null)
            setting.setElectricityCommonCharge(nonNegative(request.getElectricityCommonCharge(), "electricityCommonCharge"));
        if (request.getSecurityCharge() != null)
            setting.setSecurityCharge(nonNegative(request.getSecurityCharge(), "securityCharge"));
        if (request.getInsuranceCharge() != null)
            setting.setInsuranceCharge(nonNegative(request.getInsuranceCharge(), "insuranceCharge"));
        if (request.getClubHouseCharge() != null)
            setting.setClubHouseCharge(nonNegative(request.getClubHouseCharge(), "clubHouseCharge"));
        if (request.getPropertyTaxShare() != null)
            setting.setPropertyTaxShare(nonNegative(request.getPropertyTaxShare(), "propertyTaxShare"));
        if (request.getNonOccupancySurchargePct() != null)
            setting.setNonOccupancySurchargePct(nonNegative(request.getNonOccupancySurchargePct(), "nonOccupancySurchargePct"));
        if (request.getGstPercentage() != null)
            setting.setGstPercentage(nonNegative(request.getGstPercentage(), "gstPercentage"));
        if (request.getLatePaymentInterestPct() != null)
            setting.setLatePaymentInterestPct(nonNegative(request.getLatePaymentInterestPct(), "latePaymentInterestPct"));

        if (request.getGracePeriodDays() != null)
            setting.setGracePeriodDays(Math.max(0, request.getGracePeriodDays()));
        if (request.getPenaltyFixed() != null)
            setting.setPenaltyFixed(nonNegative(request.getPenaltyFixed(), "penaltyFixed"));
        if (request.getBillGenerationDay() != null)
            setting.setBillGenerationDay(request.getBillGenerationDay());
        if (request.getDueDateDay() != null)
            setting.setDueDateDay(request.getDueDateDay());
        if (request.getFinancialYearStartMonth() != null)
            setting.setFinancialYearStartMonth(request.getFinancialYearStartMonth());

        if (request.getBillNumberPrefix() != null && !request.getBillNumberPrefix().isBlank())
            setting.setBillNumberPrefix(request.getBillNumberPrefix().trim());
        if (request.getReceiptNumberPrefix() != null && !request.getReceiptNumberPrefix().isBlank())
            setting.setReceiptNumberPrefix(request.getReceiptNumberPrefix().trim());
    }

    private BigDecimal nonNegative(BigDecimal value, String field) {
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, field + " cannot be negative");
        }
        return value;
    }

    private SocietySettingResponse toResponse(SocietySetting s) {
        SocietySettingResponse r = new SocietySettingResponse();
        r.setId(s.getId());
        r.setSocietyId(s.getSociety() != null ? s.getSociety().getId() : null);
        r.setSocietyName(s.getSociety() != null ? s.getSociety().getName() : null);

        r.setMaintenanceRatePerSqft(s.getMaintenanceRatePerSqft());
        r.setWaterChargesFixed(s.getWaterChargesFixed());
        r.setWaterChargesPerPerson(s.getWaterChargesPerPerson());
        r.setSinkingFundPerSqft(s.getSinkingFundPerSqft());
        r.setRepairFundPerSqft(s.getRepairFundPerSqft());
        r.setParkingChargeOpen(s.getParkingChargeOpen());
        r.setParkingChargeCovered(s.getParkingChargeCovered());
        r.setParkingChargeStilt(s.getParkingChargeStilt());
        r.setParkingChargeTwoWheeler(s.getParkingChargeTwoWheeler());
        r.setLiftMaintenanceCharge(s.getLiftMaintenanceCharge());
        r.setElectricityCommonCharge(s.getElectricityCommonCharge());
        r.setSecurityCharge(s.getSecurityCharge());
        r.setInsuranceCharge(s.getInsuranceCharge());
        r.setClubHouseCharge(s.getClubHouseCharge());
        r.setPropertyTaxShare(s.getPropertyTaxShare());
        r.setNonOccupancySurchargePct(s.getNonOccupancySurchargePct());
        r.setGstPercentage(s.getGstPercentage());
        r.setLatePaymentInterestPct(s.getLatePaymentInterestPct());
        r.setGracePeriodDays(s.getGracePeriodDays());
        r.setPenaltyFixed(s.getPenaltyFixed());
        r.setBillGenerationDay(s.getBillGenerationDay());
        r.setDueDateDay(s.getDueDateDay());
        r.setFinancialYearStartMonth(s.getFinancialYearStartMonth());
        r.setBillNumberPrefix(s.getBillNumberPrefix());
        r.setReceiptNumberPrefix(s.getReceiptNumberPrefix());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());

        return r;
    }
}