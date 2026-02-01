package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRequest;
import com.society.backend.dto.society.SocietyResponse;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.WingRepository;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocietyServiceImpl implements SocietyService {

    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final WingRepository wingRepository;

    @Override
    public SocietyResponse create(SocietyRequest request) {
        Society society = new Society();
        mapRequestToEntity(request, society);
        Society saved = societyRepository.save(society);
        return toResponse(saved);
    }

    @Override
    public List<SocietyResponse> getAll() {
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
        society.setPhone(request.getPhone());
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
        response.setPhone(society.getPhone());

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

        return response;
    }
}
