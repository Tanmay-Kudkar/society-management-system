package com.society.backend.service.flat;

import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.entity.Wing;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.WingRepository;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlatServiceImpl implements FlatService {

    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final WingRepository wingRepository;

    @Override
    public FlatResponse create(FlatRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        // Validate society capacity before creating unit
        String unitType = request.getUnitType() != null ? request.getUnitType() : "FLAT";
        validateCapacity(society, unitType, 1);

        Flat flat = new Flat();
        mapRequestToEntity(request, flat, society);
        Flat saved = flatRepository.save(flat);
        log.info("Created unit {} (type: {}) in society {}", saved.getFlatNumber(), unitType, society.getId());
        return toResponse(saved);
    }

    @Override
    public List<FlatResponse> getAll(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // PLATFORM_OWNER can see all flats
        if (currentUser.getRole() == Role.PLATFORM_OWNER) {
            return flatRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // Other users can only see flats from their society
        if (currentUser.getSociety() == null) {
            return List.of();
        }

        Long societyId = currentUser.getSociety().getId();
        return flatRepository.findBySocietyId(societyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FlatResponse> getBySociety(Long societyId) {
        return flatRepository.findBySocietyId(societyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FlatResponse getById(Long id) {
        Flat flat = flatRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
        return toResponse(flat);
    }

    @Override
    public FlatResponse update(Long id, FlatRequest request) {
        Flat flat = flatRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        mapRequestToEntity(request, flat, society);
        Flat saved = flatRepository.save(flat);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!flatRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Flat not found");
        }
        flatRepository.deleteById(id);
    }

    /**
     * Validate that adding the specified number of units won't exceed society capacity.
     * Society capacity = maximum number of units allowed per type (totalFlats, totalShops, totalOffices).
     */
    private void validateCapacity(Society society, String unitType, int countToAdd) {
        Long societyId = society.getId();
        long currentCount = flatRepository.countBySocietyIdAndUnitType(societyId, unitType);

        int maxAllowed = switch (unitType) {
            case "FLAT" -> society.getTotalFlats() != null ? society.getTotalFlats() : 0;
            case "SHOP" -> society.getTotalShops() != null ? society.getTotalShops() : 0;
            case "OFFICE" -> society.getTotalOffices() != null ? society.getTotalOffices() : 0;
            default -> 0;
        };

        // If capacity is 0, it means unlimited (no cap configured)
        if (maxAllowed > 0 && (currentCount + countToAdd) > maxAllowed) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    String.format("Society capacity limit exceeded. Maximum allowed %s units: %d. Current: %d",
                            unitType.toLowerCase(), maxAllowed, currentCount));
        }
    }

    private void mapRequestToEntity(FlatRequest request, Flat flat, Society society) {
        flat.setSociety(society);
        flat.setFlatNumber(request.getFlatNumber());
        flat.setUnitType(request.getUnitType() != null ? request.getUnitType() : "FLAT");
        flat.setFlatType(request.getFlatType());
        flat.setFloor(request.getFloor());
        flat.setArea(request.getArea());
        flat.setOwnerName(request.getOwnerName());
        flat.setOwnerEmail(request.getOwnerEmail());
        flat.setOwnerPhone(request.getOwnerPhone());

        // Handle wing assignment
        if (request.getWingId() != null) {
            Wing wing = wingRepository.findById(request.getWingId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wing not found"));
            flat.setWing(wing);
        } else {
            flat.setWing(null);
        }
    }

    private FlatResponse toResponse(Flat flat) {
        FlatResponse response = new FlatResponse();
        response.setId(flat.getId());
        response.setSocietyId(flat.getSociety().getId());
        response.setSocietyName(flat.getSociety().getName());

        if (flat.getWing() != null) {
            response.setWingId(flat.getWing().getId());
            response.setWingName(flat.getWing().getName());
        }

        response.setFlatNumber(flat.getFlatNumber());
        response.setUnitType(flat.getUnitType() != null ? flat.getUnitType() : "FLAT");
        response.setFlatType(flat.getFlatType());
        response.setFloor(flat.getFloor());
        response.setArea(flat.getArea());
        response.setOwnerName(flat.getOwnerName());
        response.setOwnerEmail(flat.getOwnerEmail());
        response.setOwnerPhone(flat.getOwnerPhone());
        response.setOwnerUserId(flat.getOwner() != null ? flat.getOwner().getId() : null);
        response.setIsOccupied(flat.getIsOccupied());
        return response;
    }
}
