package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRateConfigRequest;
import com.society.backend.dto.society.SocietyRateConfigResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.SocietyRateConfig;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.society.SocietyRateConfigRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocietyRateConfigServiceImpl implements SocietyRateConfigService {

    private final SocietyRateConfigRepository rateConfigRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    public List<SocietyRateConfigResponse> getBySociety(Long societyId) {
        return rateConfigRepository.findBySocietyIdOrderByDisplayOrderAsc(societyId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<SocietyRateConfigResponse> getActiveBySociety(Long societyId) {
        return rateConfigRepository.findBySocietyIdAndIsActiveTrueOrderByDisplayOrderAsc(societyId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public SocietyRateConfigResponse getById(Long id) {
        return mapToResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public SocietyRateConfigResponse create(SocietyRateConfigRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        String applicableTo = request.getApplicableTo() != null ? request.getApplicableTo() : "ALL";

        // Check for duplicate
        if (rateConfigRepository.findBySocietyIdAndChargeTypeAndApplicableTo(
                request.getSocietyId(), request.getChargeType(), applicableTo).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Rate config already exists for charge type '" + request.getChargeType()
                    + "' with applicable type '" + applicableTo + "'");
        }

        SocietyRateConfig config = new SocietyRateConfig();
        config.setSociety(society);
        config.setChargeType(request.getChargeType().toUpperCase());
        config.setDescription(request.getDescription());
        config.setAmount(request.getAmount());
        config.setApplicableTo(applicableTo.toUpperCase());
        config.setIsPerSqft(request.getIsPerSqft() != null ? request.getIsPerSqft() : false);
        config.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        config.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return mapToResponse(rateConfigRepository.save(config));
    }

    @Override
    @Transactional
    public SocietyRateConfigResponse update(Long id, SocietyRateConfigRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        SocietyRateConfig config = findOrThrow(id);

        if (request.getDescription() != null) config.setDescription(request.getDescription());
        if (request.getAmount() != null)      config.setAmount(request.getAmount());
        if (request.getApplicableTo() != null) config.setApplicableTo(request.getApplicableTo().toUpperCase());
        if (request.getIsPerSqft() != null)   config.setIsPerSqft(request.getIsPerSqft());
        if (request.getDisplayOrder() != null) config.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsActive() != null)    config.setIsActive(request.getIsActive());

        return mapToResponse(rateConfigRepository.save(config));
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        if (!rateConfigRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Rate config not found");
        }
        rateConfigRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void toggleActive(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        SocietyRateConfig config = findOrThrow(id);
        config.setIsActive(!config.getIsActive());
        rateConfigRepository.save(config);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private SocietyRateConfig findOrThrow(Long id) {
        return rateConfigRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Rate config not found"));
    }

    private SocietyRateConfigResponse mapToResponse(SocietyRateConfig config) {
        SocietyRateConfigResponse r = new SocietyRateConfigResponse();
        r.setId(config.getId());
        r.setSocietyId(config.getSociety().getId());
        r.setSocietyName(config.getSociety().getName());
        r.setChargeType(config.getChargeType());
        r.setDescription(config.getDescription());
        r.setAmount(config.getAmount());
        r.setApplicableTo(config.getApplicableTo());
        r.setIsPerSqft(config.getIsPerSqft());
        r.setDisplayOrder(config.getDisplayOrder());
        r.setIsActive(config.getIsActive());
        r.setCreatedAt(config.getCreatedAt());
        r.setUpdatedAt(config.getUpdatedAt());
        return r;
    }
}
