package com.society.backend.security.service;

import com.society.backend.security.dto.request.VehicleRequest;
import com.society.backend.security.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleService {
    VehicleResponse create(VehicleRequest request, Long userId);

    VehicleResponse getById(Long id);

    List<VehicleResponse> getByFlatId(Long flatId);

    List<VehicleResponse> getBySocietyId(Long societyId);

    List<VehicleResponse> getAll();

    VehicleResponse update(Long id, VehicleRequest request, Long userId);

    void delete(Long id, Long userId);
}
