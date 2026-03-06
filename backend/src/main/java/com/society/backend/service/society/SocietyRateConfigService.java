package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRateConfigRequest;
import com.society.backend.dto.society.SocietyRateConfigResponse;

import java.util.List;

/**
 * Service interface for managing per-society charge rate configurations.
 * F08 — Society Rate Configuration
 */
public interface SocietyRateConfigService {

    List<SocietyRateConfigResponse> getBySociety(Long societyId);

    List<SocietyRateConfigResponse> getActiveBySociety(Long societyId);

    SocietyRateConfigResponse getById(Long id);

    SocietyRateConfigResponse create(SocietyRateConfigRequest request, Long userId);

    SocietyRateConfigResponse update(Long id, SocietyRateConfigRequest request, Long userId);

    void delete(Long id, Long userId);

    void toggleActive(Long id, Long userId);
}
