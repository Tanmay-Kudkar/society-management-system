package com.society.backend.service.tenant;

import com.society.backend.dto.tenant.TenantRequest;
import com.society.backend.dto.tenant.TenantResponse;

import java.util.List;

public interface TenantService {
    TenantResponse create(TenantRequest request, Long userId);

    TenantResponse getById(Long id);

    List<TenantResponse> getByFlatId(Long flatId);

    List<TenantResponse> getAll();

    List<TenantResponse> getActive();

    TenantResponse update(Long id, TenantRequest request, Long userId);

    TenantResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId);
}
