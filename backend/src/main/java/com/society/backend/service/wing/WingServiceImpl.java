package com.society.backend.service.wing;

import com.society.backend.dto.wing.WingRequest;
import com.society.backend.dto.wing.WingResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.Wing;
import com.society.backend.repository.WingRepository;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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

    @Override
    public List<WingResponse> getAll() {
        return wingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<WingResponse> getBySociety(Long societyId) {
        return wingRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public WingResponse getById(Long id) {
        Wing wing = wingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Wing not found with id: " + id));
        return mapToResponse(wing);
    }

    @Override
    @Transactional
    public WingResponse create(WingRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new EntityNotFoundException("Society not found with id: " + request.getSocietyId()));

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
                .orElseThrow(() -> new EntityNotFoundException("Wing not found with id: " + id));

        wing.setName(request.getName());
        wing.setDescription(request.getDescription());
        wing.setTotalFloors(request.getTotalFloors());

        Wing saved = wingRepository.save(wing);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!wingRepository.existsById(id)) {
            throw new EntityNotFoundException("Wing not found with id: " + id);
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
