package com.society.backend.flat.service;

import com.society.backend.flat.dto.request.TenantRequest;
import com.society.backend.flat.dto.response.TenantResponse;

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
