package com.society.backend.vendor.repository;

import com.society.backend.vendor.entity.VendorBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorBillRepository extends JpaRepository<VendorBill, Long> {
    List<VendorBill> findByVendorId(Long vendorId);

    List<VendorBill> findBySocietyId(Long societyId);

    List<VendorBill> findByStatus(String status);

    List<VendorBill> findBySocietyIdAndStatus(Long societyId, String status);
}
