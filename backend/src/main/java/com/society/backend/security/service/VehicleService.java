package com.society.backend.security.service;

import com.society.backend.security.dto.VehicleRequest;
import com.society.backend.security.dto.VehicleResponse;

import java.util.List;

public interface VehicleService {
    VehicleResponse create(VehicleRequest request, Long userId);

    VehicleResponse getById(Long id);

    List<VehicleResponse> getByFlatId(Long flatId);

    List<VehicleResponse> getAll();

    VehicleResponse update(Long id, VehicleRequest request, Long userId);

    void delete(Long id, Long userId);
}
