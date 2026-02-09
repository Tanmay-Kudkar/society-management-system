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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocietyServiceImpl implements SocietyService {

    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final WingRepository wingRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Override
    public SocietyResponse create(SocietyRequest request) {
        Society society = new Society();
        mapRequestToEntity(request, society);

        // If organizationId is provided, link society to organization
        if (request.getOrganizationId() != null) {
            var org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
            long currentCount = societyRepository.countByOrganizationId(org.getId());
            if (!org.canCreateMoreSocieties(currentCount)) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "Organization has reached its maximum number of societies");
            }
            society.setOrganization(org);
        } else {
            // Check if current user is ORGANIZATION_OWNER - auto-assign their org
            User currentUser = getCurrentUser();
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
        User currentUser = getCurrentUser();

        // ORGANIZATION_OWNER sees only their organization's societies
        if (currentUser != null && currentUser.getRole() == Role.ORGANIZATION_OWNER
                && currentUser.getOrganization() != null) {
            return societyRepository.findByOrganizationId(currentUser.getOrganization().getId())
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
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
        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        return toResponse(society);
    }

    @Override
    public SocietyResponse update(Long id, SocietyRequest request) {
        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        mapRequestToEntity(request, society);
        Society saved = societyRepository.save(society);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!societyRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Society not found");
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

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }
}
