package com.society.backend.service.flat;

import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlatServiceImpl implements FlatService {

    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    public FlatServiceImpl(FlatRepository flatRepository, SocietyRepository societyRepository,
            UserRepository userRepository) {
        this.flatRepository = flatRepository;
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
    }

    @Override
    public FlatResponse create(FlatRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Flat flat = new Flat();
        mapRequestToEntity(request, flat, society);
        Flat saved = flatRepository.save(flat);
        return toResponse(saved);
    }

    @Override
    public List<FlatResponse> getAll(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // MASTER_ADMIN can see all flats
        if (currentUser.getRole() == Role.MASTER_ADMIN) {
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

    private void mapRequestToEntity(FlatRequest request, Flat flat, Society society) {
        flat.setSociety(society);
        flat.setFlatNumber(request.getFlatNumber());
        flat.setFlatType(request.getFlatType());
        flat.setFloor(request.getFloor());
        flat.setArea(request.getArea());
        flat.setOwnerName(request.getOwnerName());
        flat.setOwnerEmail(request.getOwnerEmail());
        flat.setOwnerPhone(request.getOwnerPhone());
    }

    private FlatResponse toResponse(Flat flat) {
        FlatResponse response = new FlatResponse();
        response.setId(flat.getId());
        response.setSocietyId(flat.getSociety().getId());
        response.setSocietyName(flat.getSociety().getName());
        response.setFlatNumber(flat.getFlatNumber());
        response.setFlatType(flat.getFlatType());
        response.setFloor(flat.getFloor());
        response.setArea(flat.getArea());
        response.setOwnerName(flat.getOwnerName());
        response.setOwnerEmail(flat.getOwnerEmail());
        response.setOwnerPhone(flat.getOwnerPhone());
        response.setIsOccupied(flat.getIsOccupied());
        return response;
    }
}
