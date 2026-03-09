package com.society.backend.security.service;

import com.society.backend.security.dto.request.VehicleRequest;
import com.society.backend.security.dto.response.VehicleResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.security.entity.Vehicle;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.security.repository.VehicleRepository;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public VehicleResponse create(VehicleRequest request, Long userId) {
        roleService.requireMember(userId);

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        Vehicle vehicle = new Vehicle();
        vehicle.setFlat(flat);
        vehicle.setSociety(flat.getSociety());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setVehicleNumber(request.getVehicleNumber());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setColor(request.getColor());
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setParkingSlot(request.getParkingSlot());

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToResponse(saved);
    }

    @Override
    public VehicleResponse getById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        if (vehicle.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), vehicle.getSociety().getId());
        }
        return mapToResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> getByFlatId(Long flatId) {
        List<Vehicle> vehicles = vehicleRepository.findByFlatId(flatId);
        if (!vehicles.isEmpty() && vehicles.get(0).getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), vehicles.get(0).getSociety().getId());
        }
        return vehicles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return vehicleRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return vehicleRepository.findAll().stream()
                .filter(v -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return v.getSociety() != null && currentUser.getSociety() != null
                            && v.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request, Long userId) {
        roleService.requireMember(userId);

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        if (vehicle.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vehicle.getSociety().getId());
        }

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            vehicle.setFlat(flat);
            vehicle.setSociety(flat.getSociety());
        }

        if (request.getVehicleType() != null)
            vehicle.setVehicleType(request.getVehicleType());
        if (request.getVehicleNumber() != null)
            vehicle.setVehicleNumber(request.getVehicleNumber());
        if (request.getBrand() != null)
            vehicle.setBrand(request.getBrand());
        if (request.getModel() != null)
            vehicle.setModel(request.getModel());
        if (request.getColor() != null)
            vehicle.setColor(request.getColor());
        if (request.getOwnerName() != null)
            vehicle.setOwnerName(request.getOwnerName());
        if (request.getParkingSlot() != null)
            vehicle.setParkingSlot(request.getParkingSlot());

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        if (vehicle.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vehicle.getSociety().getId());
        }
        vehicleRepository.deleteById(id);
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setFlatId(vehicle.getFlat().getId());
        response.setFlatNumber(vehicle.getFlat().getFlatNumber());
        if (vehicle.getFlat().getSociety() != null) {
            response.setSocietyId(vehicle.getFlat().getSociety().getId());
        }
        response.setVehicleType(vehicle.getVehicleType());
        response.setVehicleNumber(vehicle.getVehicleNumber());
        response.setBrand(vehicle.getBrand());
        response.setModel(vehicle.getModel());
        response.setColor(vehicle.getColor());
        response.setOwnerName(vehicle.getOwnerName());
        response.setParkingSlot(vehicle.getParkingSlot());
        response.setCreatedAt(vehicle.getCreatedAt());
        return response;
    }
}
