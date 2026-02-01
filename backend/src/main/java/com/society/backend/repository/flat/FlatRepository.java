package com.society.backend.repository.flat;

import com.society.backend.entity.Flat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlatRepository extends JpaRepository<Flat, Long> {
    List<Flat> findBySocietyId(Long societyId);

    List<Flat> findByWingId(Long wingId);

    // Count by unit type
    long countBySocietyIdAndUnitType(Long societyId, String unitType);

    // Count occupied by unit type
    long countBySocietyIdAndUnitTypeAndIsOccupied(Long societyId, String unitType, Boolean isOccupied);

    // Count by wing
    long countByWingId(Long wingId);

    long countByWingIdAndUnitType(Long wingId, String unitType);
}
