package com.society.backend.flat.service;

import com.society.backend.flat.dto.request.WingRequest;
import com.society.backend.flat.dto.response.WingResponse;
import com.society.backend.user.entity.Role;
import com.society.backend.society.entity.Society;
import com.society.backend.flat.entity.Wing;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.WingRepository;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.common.service.ReferenceCleanupService;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.society.backend.flat.entity.Flat;
@Service
@RequiredArgsConstructor
public class WingServiceImpl implements WingService {

    private final WingRepository wingRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;
    private final ReferenceCleanupService referenceCleanupService;

    @Override
    public List<WingResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        List<Wing> wings;
        if (currentUser.getRole() == Role.MASTER_ADMIN) {
            wings = wingRepository.findAll();
        } else if (currentUser.getSociety() != null) {
            roleService.enforceSocietyScope(currentUser, currentUser.getSociety().getId());
            wings = wingRepository.findBySocietyId(currentUser.getSociety().getId());
        } else {
            wings = List.of();
        }

        return wings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<WingResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return wingRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public WingResponse getById(Long id) {
        Wing wing = wingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wing not found"));
        if (wing.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), wing.getSociety().getId());
        }
        return mapToResponse(wing);
    }

    @Override
    @Transactional
    public WingResponse create(WingRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        roleService.enforceSocietyScope(roleService.getCurrentUser(), society.getId());

        Integer totalWings = society.getTotalWings();
        if (totalWings != null && totalWings > 0) {
            long currentWingCount = wingRepository.countBySocietyId(society.getId());
            if (currentWingCount >= totalWings) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot create more wings. Society capacity reached: " + currentWingCount + "/" + totalWings);
            }
        }

        Wing wing = new Wing();
        wing.setSociety(society);
        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(request.getTotalFloors());

        Wing saved = wingRepository.save(wing);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public WingResponse update(Long id, WingRequest request) {
        Wing wing = wingRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wing not found"));

        if (wing.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), wing.getSociety().getId());
        }

        Society society = societyRepository.findById(request.getSocietyId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), society.getId());

        if (!society.getId().equals(wing.getSociety().getId())) {
            Integer totalWings = society.getTotalWings();
            if (totalWings != null && totalWings > 0) {
                long currentWingCount = wingRepository.countBySocietyId(society.getId());
                if (currentWingCount >= totalWings) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Cannot move wing. Target society capacity reached: " + currentWingCount + "/" + totalWings);
                }
            }
        }

        wing.setSociety(society);

        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(request.getTotalFloors());

        Wing saved = wingRepository.save(wing);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, boolean force) {
        var wing = wingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wing not found"));
        if (wing.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), wing.getSociety().getId());
        }

        // Check for linked flats
        long linkedFlats = flatRepository.countByWingId(id);
        if (!force && linkedFlats > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    String.format("Cannot delete wing '%s'. It has %d linked unit(s). Use force delete to auto-clean.",
                            wing.getName(), linkedFlats));
        }

        if (force) {
            referenceCleanupService.clearReferences("wing_id", id, false, Set.of("wings"));
        }

        wingRepository.deleteById(id);
    }

    private WingResponse mapToResponse(Wing wing) {
        WingResponse response = new WingResponse();
        response.setId(wing.getId());
        response.setSocietyId(wing.getSociety().getId());
        response.setSocietyName(wing.getSociety().getName());
        response.setName(wing.getName());
        response.setDescription(wing.getDescription());
        response.setTotalFloors(wing.getTotalFloors());
        response.setCreatedAt(wing.getCreatedAt());

        // Get counts by unit type
        Long wingId = wing.getId();
        response.setFlatCount(flatRepository.countByWingIdAndUnitType(wingId, "FLAT"));
        response.setShopCount(flatRepository.countByWingIdAndUnitType(wingId, "SHOP"));
        response.setOfficeCount(flatRepository.countByWingIdAndUnitType(wingId, "OFFICE"));

        return response;
    }
}
