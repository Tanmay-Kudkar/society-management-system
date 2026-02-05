package com.society.backend.repository.flat;

import com.society.backend.entity.Flat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlatRepository extends JpaRepository<Flat, Long> {
    List<Flat> findBySocietyId(Long societyId);

    List<Flat> findByWingId(Long wingId);

    // Find by society and flat number (for bulk import linking)
    Optional<Flat> findBySocietyIdAndFlatNumber(Long societyId, String flatNumber);

    // Count by unit type
    long countBySocietyIdAndUnitType(Long societyId, String unitType);

    // Count occupied by unit type
    long countBySocietyIdAndUnitTypeAndIsOccupied(Long societyId, String unitType, Boolean isOccupied);

    // Count by wing
    long countByWingId(Long wingId);

    long countByWingIdAndUnitType(Long wingId, String unitType);
}
