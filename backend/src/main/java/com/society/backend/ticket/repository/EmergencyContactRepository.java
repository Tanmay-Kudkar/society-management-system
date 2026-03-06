package com.society.backend.ticket.repository;

import com.society.backend.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    List<EmergencyContact> findBySocietyId(Long societyId);

    List<EmergencyContact> findByContactType(String contactType);

    List<EmergencyContact> findBySocietyIdAndIsActiveTrue(Long societyId);
}
