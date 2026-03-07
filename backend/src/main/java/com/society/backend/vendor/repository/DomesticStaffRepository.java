package com.society.backend.vendor.repository;

import com.society.backend.vendor.entity.DomesticStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DomesticStaffRepository extends JpaRepository<DomesticStaff, Long> {
    List<DomesticStaff> findBySocietyId(Long societyId);
    List<DomesticStaff> findByStaffType(String staffType);
    List<DomesticStaff> findBySocietyIdAndIsActiveTrue(Long societyId);
    List<DomesticStaff> findBySocietyIdAndStaffType(Long societyId, String staffType);
}
