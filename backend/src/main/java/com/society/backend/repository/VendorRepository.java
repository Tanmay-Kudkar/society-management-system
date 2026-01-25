package com.society.backend.repository;

import com.society.backend.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findBySocietyId(Long societyId);

    List<Vendor> findByIsCommonTrue();

    List<Vendor> findByServiceType(String serviceType);

    List<Vendor> findByIsActiveTrue();
}
