package com.society.backend.notice.repository;

import com.society.backend.entity.Classified;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassifiedRepository extends JpaRepository<Classified, Long> {

    Page<Classified> findBySocietyId(Long societyId, Pageable pageable);

    Page<Classified> findBySocietyIdAndStatus(Long societyId, String status, Pageable pageable);

    Page<Classified> findBySocietyIdAndCategory(Long societyId, String category, Pageable pageable);

    Page<Classified> findBySocietyIdAndListingType(Long societyId, String listingType, Pageable pageable);

    long countBySocietyIdAndStatus(Long societyId, String status);

    long countBySocietyIdAndCategory(Long societyId, String category);

    long countBySocietyIdAndFlagged(Long societyId, Boolean flagged);
}
