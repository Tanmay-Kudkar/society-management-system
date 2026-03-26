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
import java.util.Comparator;
import java.util.stream.Collectors;

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
    @Transactional
    public List<WingResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        societyRepository.findById(societyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        return getSortedWingsForSociety(societyId).stream()
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

        if (Boolean.FALSE.equals(society.getHasWings())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "This society is configured as a single-tower setup and does not use wings.");
        }

        Integer totalWings = society.getTotalWings();
        if (totalWings != null && totalWings > 0) {
            long currentWingCount = wingRepository.countBySocietyId(society.getId());
            if (currentWingCount >= totalWings) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot create more wings. Society capacity reached: " + currentWingCount + "/" + totalWings);
            }
        }

        int configuredSocietyFloors = society.getTotalFloors() != null ? society.getTotalFloors() : 0;
        int requestedWingFloors = request.getTotalFloors() != null ? request.getTotalFloors() : configuredSocietyFloors;
        if (configuredSocietyFloors > 0 && requestedWingFloors > configuredSocietyFloors) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Wing floors cannot exceed society floors: " + configuredSocietyFloors);
        }
        if (requestedWingFloors < 1) {
            requestedWingFloors = configuredSocietyFloors > 0 ? configuredSocietyFloors : 1;
        }

        Wing wing = new Wing();
        wing.setSociety(society);
        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(requestedWingFloors);

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

        if (Boolean.FALSE.equals(society.getHasWings())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "This society is configured as a single-tower setup and does not use wings.");
        }

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

        int configuredSocietyFloors = society.getTotalFloors() != null ? society.getTotalFloors() : 0;
        int requestedWingFloors = request.getTotalFloors() != null ? request.getTotalFloors() : configuredSocietyFloors;
        if (configuredSocietyFloors > 0 && requestedWingFloors > configuredSocietyFloors) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Wing floors cannot exceed society floors: " + configuredSocietyFloors);
        }
        if (requestedWingFloors < 1) {
            requestedWingFloors = configuredSocietyFloors > 0 ? configuredSocietyFloors : 1;
        }

        wing.setSociety(society);

        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(requestedWingFloors);

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

    @Override
    @Transactional
    public int syncWithSocietyConfig(Long societyId, boolean force) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        List<Wing> sortedWings = getSortedWingsForSociety(societyId);

        int societyFloors = society.getTotalFloors() != null ? society.getTotalFloors() : 0;
        for (Wing wing : sortedWings) {
            int wingFloors = wing.getTotalFloors() != null ? wing.getTotalFloors() : 0;
            int normalized = societyFloors > 0
                    ? Math.min(Math.max(wingFloors, 1), societyFloors)
                    : Math.max(wingFloors, 1);
            if (wingFloors != normalized) {
                wing.setTotalFloors(normalized);
                wingRepository.save(wing);
            }
        }

        int totalWingsLimit = society.getTotalWings() != null ? society.getTotalWings() : 0;
        if (totalWingsLimit <= 0 || sortedWings.size() <= totalWingsLimit) {
            return 0;
        }

        List<Wing> extras = sortedWings.subList(totalWingsLimit, sortedWings.size());

        if (!force) {
            long extrasWithUnits = extras.stream()
                    .filter(wing -> flatRepository.countByWingId(wing.getId()) > 0)
                    .count();
            if (extrasWithUnits > 0) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Cannot sync wings automatically because extra wings have linked units. Use force sync to unlink and remove extras.");
            }
        }

        for (Wing extra : extras) {
            if (force && flatRepository.countByWingId(extra.getId()) > 0) {
                referenceCleanupService.clearReferences("wing_id", extra.getId(), false, Set.of("wings"));
            }
            wingRepository.deleteById(extra.getId());
        }

        return extras.size();
    }

    private WingResponse mapToResponse(Wing wing) {
        WingResponse response = new WingResponse();
        response.setId(wing.getId());
        response.setSocietyId(wing.getSociety().getId());
        response.setSocietyName(wing.getSociety().getName());
        response.setName(wing.getName());
        response.setDescription(wing.getDescription());
        int wingFloors = wing.getTotalFloors() != null ? wing.getTotalFloors() : 0;
        int societyFloors = (wing.getSociety() != null && wing.getSociety().getTotalFloors() != null)
                ? wing.getSociety().getTotalFloors()
                : 0;
        if (societyFloors > 0 && (wingFloors <= 0 || wingFloors > societyFloors)) {
            wingFloors = societyFloors;
        }
        if (wingFloors <= 0) {
            wingFloors = 1;
        }
        response.setTotalFloors(wingFloors);
        response.setCreatedAt(wing.getCreatedAt());

        // Get counts by unit type
        Long wingId = wing.getId();
        response.setFlatCount(flatRepository.countByWingIdAndUnitType(wingId, "FLAT"));
        response.setShopCount(flatRepository.countByWingIdAndUnitType(wingId, "SHOP"));
        response.setOfficeCount(flatRepository.countByWingIdAndUnitType(wingId, "OFFICE"));

        return response;
    }

    private List<Wing> getSortedWingsForSociety(Long societyId) {
        return wingRepository.findBySocietyId(societyId).stream()
                .sorted(Comparator
                        .comparing((Wing w) -> String.valueOf(w.getName()), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Wing::getId))
                .collect(Collectors.toList());
    }
}
