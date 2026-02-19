package com.society.backend.repository;

import com.society.backend.entity.SocietyRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SocietyRuleRepository extends JpaRepository<SocietyRule, Long> {

    Page<SocietyRule> findBySocietyId(Long societyId, Pageable pageable);

    Page<SocietyRule> findBySocietyIdAndStatus(Long societyId, String status, Pageable pageable);

    Page<SocietyRule> findBySocietyIdAndCategory(Long societyId, String category, Pageable pageable);

    Page<SocietyRule> findBySocietyIdAndIsActive(Long societyId, Boolean isActive, Pageable pageable);

    long countBySocietyIdAndStatus(Long societyId, String status);

    long countBySocietyIdAndIsActive(Long societyId, Boolean isActive);

    long countBySocietyIdAndIsMandatory(Long societyId, Boolean isMandatory);
}
