package com.society.backend.service.wing;

import com.society.backend.dto.wing.WingRequest;
import com.society.backend.dto.wing.WingResponse;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.Wing;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.WingRepository;
import com.society.backend.repository.flat.FlatRepository;
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
public class WingServiceImpl implements WingService {

    private final WingRepository wingRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    @Override
    public List<WingResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        List<Wing> wings;
        if (currentUser.getRole() == Role.PLATFORM_OWNER) {
            wings = wingRepository.findAll();
        } else if (currentUser.getRole() == Role.ORGANIZATION_OWNER && currentUser.getOrganization() != null) {
            wings = wingRepository.findByOrganizationId(currentUser.getOrganization().getId());
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
        wing.setOrganization(society.getOrganization());
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
        wing.setOrganization(society.getOrganization());

        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(request.getTotalFloors());

        Wing saved = wingRepository.save(wing);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        var wing = wingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wing not found"));
        if (wing.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), wing.getSociety().getId());
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
