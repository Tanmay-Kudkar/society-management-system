package com.society.backend.security.repository;

import com.society.backend.security.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByFlatId(Long flatId);

    List<Vehicle> findByVehicleType(String vehicleType);

    List<Vehicle> findBySocietyId(Long societyId);
}
