package com.society.backend.service.vendor;

import com.society.backend.dto.vendor.VendorRequest;
import com.society.backend.dto.vendor.VendorResponse;

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

    void delete(Long id, Long userId);
}
