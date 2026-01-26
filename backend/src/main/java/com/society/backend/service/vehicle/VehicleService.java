package com.society.backend.service.vehicle;

import com.society.backend.dto.vehicle.VehicleRequest;
import com.society.backend.dto.vehicle.VehicleResponse;

import java.util.List;

public interface VehicleService {
    VehicleResponse create(VehicleRequest request, Long userId);

    VehicleResponse getById(Long id);

    List<VehicleResponse> getByFlatId(Long flatId);

    List<VehicleResponse> getAll();

    VehicleResponse update(Long id, VehicleRequest request, Long userId);

    void delete(Long id, Long userId);
}
