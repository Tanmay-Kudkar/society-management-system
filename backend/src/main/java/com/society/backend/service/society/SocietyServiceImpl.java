package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRequest;
import com.society.backend.dto.society.SocietyResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.WingRepository;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.organization.OrganizationRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.common.ReferenceCleanupService;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocietyServiceImpl implements SocietyService {

    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final WingRepository wingRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ReferenceCleanupService referenceCleanupService;
    private final RoleService roleService;

    @Override
    public SocietyResponse create(SocietyRequest request) {
        Society society = new Society();
        mapRequestToEntity(request, society);

        var currentUser = roleService.getCurrentUser();

        // If organizationId is provided, link society to organization
        if (request.getOrganizationId() != null) {
            var org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
            if (currentUser != null && currentUser.getRole() == Role.ORGANIZATION_OWNER) {
                roleService.enforceOrganizationScope(currentUser, org.getId());
            }
            long currentCount = societyRepository.countByOrganizationId(org.getId());
            if (!org.canCreateMoreSocieties(currentCount)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Organization has reached its maximum number of societies");
            }
            society.setOrganization(org);
        } else {
            // Check if current user is ORGANIZATION_OWNER - auto-assign their org
            if (currentUser != null && currentUser.getRole() == Role.ORGANIZATION_OWNER
                    && currentUser.getOrganization() != null) {
                var org = currentUser.getOrganization();
                long currentCount = societyRepository.countByOrganizationId(org.getId());
                if (!org.canCreateMoreSocieties(currentCount)) {
                    throw new ApiException(HttpStatus.FORBIDDEN,
                            "Organization has reached its maximum number of societies");
                }
                society.setOrganization(org);
            }
        }

        Society saved = societyRepository.save(society);
        return toResponse(saved);
    }

    @Override
    public List<SocietyResponse> getAll() {
        User currentUser = roleService.getCurrentUser();

        // ORGANIZATION_OWNER sees only their organization's societies
        if (currentUser != null && currentUser.getRole() == Role.ORGANIZATION_OWNER) {
            if (currentUser.getOrganization() != null) {
                return societyRepository.findByOrganizationId(currentUser.getOrganization().getId())
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
            }
            // No organization linked yet - return empty list (not all societies)
            return List.of();
        }

        // PLATFORM_OWNER sees all societies
        if (currentUser != null && currentUser.getRole() == Role.PLATFORM_OWNER) {
            return societyRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // SOCIETY_ADMIN and below see only their assigned society
        if (currentUser != null && currentUser.getSociety() != null) {
            return List.of(toResponse(currentUser.getSociety()));
        }

        return societyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SocietyResponse getById(Long id) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null) {
            roleService.enforceSocietyScope(currentUser, id);
        }

        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        return toResponse(society);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SocietyResponse> getByOrganizationId(Long organizationId) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.ORGANIZATION_OWNER) {
            roleService.enforceOrganizationScope(currentUser, organizationId);
        }
        return societyRepository.findByOrganizationIdWithOrg(organizationId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SocietyResponse update(Long id, SocietyRequest request) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null) {
            roleService.enforceSocietyScope(currentUser, id);
        }

        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        mapRequestToEntity(request, society);
        Society saved = societyRepository.save(society);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, boolean force) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null) {
            roleService.enforceSocietyScope(currentUser, id);
        }

        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        long linkedUsers = userRepository.countBySocietyId(id);
        long linkedWings = wingRepository.countBySocietyId(id);
        long linkedFlats = flatRepository.findBySocietyId(id).size();

        if (!force && (linkedUsers > 0 || linkedWings > 0 || linkedFlats > 0)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    String.format(
                            "Cannot delete society '%s'. Remove linked records first (%d users, %d wings, %d units). Use force delete to auto-clean linked records.",
                            society.getName(),
                            linkedUsers,
                            linkedWings,
                            linkedFlats));
        }

        if (force) {
            var flatIds = flatRepository.findBySocietyId(id).stream().map(flat -> flat.getId()).toList();
            var wingIds = wingRepository.findBySocietyId(id).stream().map(com.society.backend.entity.Wing::getId).toList();

            for (Long flatId : flatIds) {
                referenceCleanupService.clearReferences("flat_id", flatId, true, Set.of("flats"));
            }

            for (Long wingId : wingIds) {
                referenceCleanupService.clearReferences("wing_id", wingId, true, Set.of("wings"));
            }

            referenceCleanupService.clearReferences("society_id", id, true, Set.of("societies"));
        }

        societyRepository.deleteById(id);
    }

    private void mapRequestToEntity(SocietyRequest request, Society society) {
        society.setName(request.getName());
        society.setAddress(request.getAddress());
        society.setCity(request.getCity());
        society.setState(request.getState());
        society.setPincode(request.getPincode());
        society.setRegistrationNumber(request.getRegistrationNumber());
        society.setEmail(request.getEmail());
        society.setTelephone(request.getTelephone());
        society.setTotalFlats(request.getTotalFlats() != null ? request.getTotalFlats() : 0);
        society.setTotalShops(request.getTotalShops() != null ? request.getTotalShops() : 0);
        society.setTotalOffices(request.getTotalOffices() != null ? request.getTotalOffices() : 0);
        society.setTotalWings(request.getTotalWings() != null ? request.getTotalWings() : 0);
    }

    private SocietyResponse toResponse(Society society) {
        SocietyResponse response = new SocietyResponse();
        response.setId(society.getId());
        response.setName(society.getName());
        response.setAddress(society.getAddress());
        response.setCity(society.getCity());
        response.setState(society.getState());
        response.setPincode(society.getPincode());
        response.setRegistrationNumber(society.getRegistrationNumber());
        response.setEmail(society.getEmail());
        response.setTelephone(society.getTelephone());

        // Total capacity
        response.setTotalFlats(society.getTotalFlats());
        response.setTotalShops(society.getTotalShops());
        response.setTotalOffices(society.getTotalOffices());
        response.setTotalWings(society.getTotalWings());

        // Calculate actual counts from database
        Long societyId = society.getId();
        response.setActualFlats(flatRepository.countBySocietyIdAndUnitType(societyId, "FLAT"));
        response.setActualShops(flatRepository.countBySocietyIdAndUnitType(societyId, "SHOP"));
        response.setActualOffices(flatRepository.countBySocietyIdAndUnitType(societyId, "OFFICE"));
        response.setActualWings(wingRepository.countBySocietyId(societyId));

        // Occupied counts
        response.setOccupiedFlats(flatRepository.countBySocietyIdAndUnitTypeAndIsOccupied(societyId, "FLAT", true));
        response.setOccupiedShops(flatRepository.countBySocietyIdAndUnitTypeAndIsOccupied(societyId, "SHOP", true));
        response.setOccupiedOffices(flatRepository.countBySocietyIdAndUnitTypeAndIsOccupied(societyId, "OFFICE", true));

        // Organization info
        if (society.getOrganization() != null) {
            response.setOrganizationId(society.getOrganization().getId());
            response.setOrganizationName(society.getOrganization().getName());
        }

        return response;
    }

}
