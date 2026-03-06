package com.society.backend.vendor.service;

import com.society.backend.vendor.dto.VendorRequest;
import com.society.backend.vendor.dto.VendorResponse;

import java.util.List;

public interface VendorService {
    VendorResponse create(VendorRequest request, Long userId);

    VendorResponse getById(Long id);

    List<VendorResponse> getBySocietyId(Long societyId);

    List<VendorResponse> getCommonVendors();

    List<VendorResponse> getByServiceType(String serviceType);

    List<VendorResponse> getAll();

    VendorResponse update(Long id, VendorRequest request, Long userId);

    VendorResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId, boolean force);

    VendorResponse approveVendor(Long id, Long userId);

    VendorResponse rejectVendor(Long id, Long userId);

    List<VendorResponse> getPendingVendors(Long societyId);
}
