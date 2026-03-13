package com.society.backend.society.service;

import com.society.backend.society.dto.request.SocietyRequest;
import com.society.backend.society.dto.response.SocietyResponse;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.WingRepository;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.ReferenceCleanupService;
import com.society.backend.common.service.RoleService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Wing;
@Service
@RequiredArgsConstructor
public class SocietyServiceImpl implements SocietyService {

    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final WingRepository wingRepository;
    private final UserRepository userRepository;
    private final ReferenceCleanupService referenceCleanupService;
    private final RoleService roleService;
    private final EntityManager entityManager;

    @Override
    public SocietyResponse create(SocietyRequest request) {
        Society society = new Society();
        mapRequestToEntity(request, society);

        Society saved = societyRepository.save(society);
        return toResponse(saved);
    }

    @Override
    public List<SocietyResponse> getAll() {
        User currentUser = roleService.getCurrentUser();

        if (currentUser != null && currentUser.getRole() == Role.MASTER_ADMIN) {
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
    public SocietyResponse update(Long id, SocietyRequest request) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null) {
            roleService.enforceSocietyScope(currentUser, id);
        }

        Society society = societyRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        boolean hasWings = request.getHasWings() != null
                ? request.getHasWings()
                : (request.getTotalWings() != null && request.getTotalWings() > 0);
        if (!hasWings) {
            long linkedWings = wingRepository.countBySocietyId(id);
            if (linkedWings > 0) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Cannot disable wings for this society while wing records exist. Delete wings first.");
            }
        }

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
            var wingIds = wingRepository.findBySocietyId(id).stream().map(com.society.backend.flat.entity.Wing::getId).toList();

            for (Long flatId : flatIds) {
                referenceCleanupService.clearReferences("flat_id", flatId, true, Set.of("flats"));
            }

            for (Long wingId : wingIds) {
                referenceCleanupService.clearReferences("wing_id", wingId, true, Set.of("wings"));
            }

            referenceCleanupService.clearReferences("society_id", id, true, Set.of("societies"));

            // ReferenceCleanupService uses raw JDBC which bypasses Hibernate's cache.
            // Flush pending JPA changes, then clear the persistence context so Hibernate
            // re-reads the now-cleaned DB state and doesn't hold stale Society references.
            entityManager.flush();
            entityManager.clear();
        }

        societyRepository.deleteById(id);
    }

    private void mapRequestToEntity(SocietyRequest request, Society society) {
        boolean hasWings = request.getHasWings() != null
                ? request.getHasWings()
                : (request.getTotalWings() != null && request.getTotalWings() > 0);

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
        society.setHasWings(hasWings);
        society.setTotalWings(hasWings ? (request.getTotalWings() != null ? request.getTotalWings() : 0) : 0);
        society.setTwoWheelerParkingCapacity(request.getTwoWheelerParkingCapacity());
        society.setFourWheelerParkingCapacity(request.getFourWheelerParkingCapacity());
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
        response.setHasWings(society.getHasWings() != null ? society.getHasWings() : true);
        response.setTwoWheelerParkingCapacity(society.getTwoWheelerParkingCapacity());
        response.setFourWheelerParkingCapacity(society.getFourWheelerParkingCapacity());

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

        return response;
    }

}
