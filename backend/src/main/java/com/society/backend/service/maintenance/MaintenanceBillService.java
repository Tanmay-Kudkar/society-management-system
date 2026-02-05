package com.society.backend.service.maintenance;

import com.society.backend.dto.maintenance.MaintenanceBillRequest;
import com.society.backend.dto.maintenance.MaintenanceBillResponse;

import java.math.BigDecimal;
import java.util.List;

public interface MaintenanceBillService {
    MaintenanceBillResponse create(MaintenanceBillRequest request, Long userId);

    MaintenanceBillResponse getById(Long id);

    List<MaintenanceBillResponse> getByFlatId(Long flatId);

    List<MaintenanceBillResponse> getByBillMonth(String billMonth);

    List<MaintenanceBillResponse> getByStatus(String status);

    List<MaintenanceBillResponse> getPending();

    List<MaintenanceBillResponse> getAll();

    MaintenanceBillResponse update(Long id, MaintenanceBillRequest request, Long userId);

    MaintenanceBillResponse recordPayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId);

    void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, Long userId);
    
    void generateBillsForSociety(Long societyId, String billMonth, BigDecimal amount, String propertyType, Long userId);
    
    int getGenerationPreviewCount(Long societyId, String billMonth, String propertyType);

    void delete(Long id, Long userId);
}
