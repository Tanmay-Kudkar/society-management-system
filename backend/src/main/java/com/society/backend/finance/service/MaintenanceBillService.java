package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.MaintenanceBillRequest;
import com.society.backend.finance.dto.response.MaintenanceBillResponse;

import java.math.BigDecimal;
import java.util.List;

import com.society.backend.finance.entity.Payment;
import com.society.backend.user.entity.Role;
public interface MaintenanceBillService {
    MaintenanceBillResponse create(MaintenanceBillRequest request, Long userId);

    MaintenanceBillResponse getById(Long id);

    List<MaintenanceBillResponse> getByFlatId(Long flatId);

    List<MaintenanceBillResponse> getByBillMonth(String billMonth);

    List<MaintenanceBillResponse> getByStatus(String status);

    List<MaintenanceBillResponse> getPending();

    List<MaintenanceBillResponse> getAll();

    List<MaintenanceBillResponse> getBySociety(Long societyId);

    MaintenanceBillResponse update(Long id, MaintenanceBillRequest request, Long userId);

    MaintenanceBillResponse recordPayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId);

    /**
     * Record online payment (Razorpay) - bypasses role check since payment is already verified
     */
    MaintenanceBillResponse recordOnlinePayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId);

    void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, Long userId);
    
    void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, String propertyType, Long userId);
    
    int getGenerationPreviewCount(Long societyId, String billMonth, String propertyType);

    void delete(Long id, Long userId);
}
