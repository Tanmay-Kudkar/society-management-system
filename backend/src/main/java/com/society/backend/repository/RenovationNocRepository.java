package com.society.backend.repository;

import com.society.backend.entity.RenovationNoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RenovationNocRepository extends JpaRepository<RenovationNoc, Long> {

    List<RenovationNoc> findBySocietyIdOrderByCreatedAtDesc(Long societyId);

    List<RenovationNoc> findBySocietyIdAndStatusOrderByCreatedAtDesc(Long societyId, String status);

    List<RenovationNoc> findBySocietyIdAndRenovationTypeOrderByCreatedAtDesc(Long societyId, String renovationType);

    List<RenovationNoc> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);

    long countBySocietyIdAndStatus(Long societyId, String status);
}
