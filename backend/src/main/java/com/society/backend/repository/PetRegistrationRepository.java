package com.society.backend.repository;

import com.society.backend.entity.PetRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PetRegistrationRepository extends JpaRepository<PetRegistration, Long> {

    Page<PetRegistration> findBySocietyId(Long societyId, Pageable pageable);

    Page<PetRegistration> findBySocietyIdAndStatus(Long societyId, String status, Pageable pageable);

    Page<PetRegistration> findBySocietyIdAndPetType(Long societyId, String petType, Pageable pageable);

    long countBySocietyIdAndStatus(Long societyId, String status);

    long countBySocietyIdAndPetType(Long societyId, String petType);

    long countBySocietyIdAndVaccinated(Long societyId, Boolean vaccinated);
}
