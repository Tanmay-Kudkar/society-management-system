package com.society.backend.service.vendor;

import com.society.backend.dto.vendor.VendorBillRequest;
import com.society.backend.dto.vendor.VendorBillResponse;

import java.math.BigDecimal;
import java.util.List;

public interface VendorBillService {
    VendorBillResponse create(VendorBillRequest request, Long userId);

    VendorBillResponse getById(Long id);

    List<VendorBillResponse> getByVendorId(Long vendorId);

    List<VendorBillResponse> getBySocietyId(Long societyId);

    List<VendorBillResponse> getByStatus(String status);

    List<VendorBillResponse> getPending(Long societyId);

    List<VendorBillResponse> getAll();

    VendorBillResponse update(Long id, VendorBillRequest request, Long userId);

    VendorBillResponse recordPayment(Long id, BigDecimal amount, String paymentMode, String referenceNumber,
            Long userId);

    void delete(Long id, Long userId);
}
