package com.society.backend.repository.society;

import com.society.backend.entity.SocietyRateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocietyRateConfigRepository extends JpaRepository<SocietyRateConfig, Long> {

    List<SocietyRateConfig> findBySocietyIdOrderByDisplayOrderAsc(Long societyId);

    List<SocietyRateConfig> findBySocietyIdAndIsActiveTrueOrderByDisplayOrderAsc(Long societyId);

    List<SocietyRateConfig> findBySocietyIdAndApplicableToInAndIsActiveTrueOrderByDisplayOrderAsc(
            Long societyId, List<String> applicableTo);

    Optional<SocietyRateConfig> findBySocietyIdAndChargeTypeAndApplicableTo(
            Long societyId, String chargeType, String applicableTo);
}
