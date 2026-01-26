package com.society.backend.service.flat;

import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlatServiceImpl implements FlatService {

    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;

    public FlatServiceImpl(FlatRepository flatRepository, SocietyRepository societyRepository) {
        this.flatRepository = flatRepository;
        this.societyRepository = societyRepository;
    }

    @Override
    public FlatResponse create(FlatRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Flat flat = new Flat();
        flat.setSociety(society);
        flat.setFlatNumber(request.getFlatNumber());
        flat.setOwnerName(request.getOwnerName());
        Flat saved = flatRepository.save(flat);
        return toResponse(saved);
    }

    @Override
    public List<FlatResponse> getAll() {
        return flatRepository.findAll().stream()
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

        flat.setSociety(society);
        flat.setFlatNumber(request.getFlatNumber());
        flat.setOwnerName(request.getOwnerName());
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

    private FlatResponse toResponse(Flat flat) {
        return new FlatResponse(
                flat.getId(),
                flat.getSociety().getId(),
                flat.getSociety().getName(),
                flat.getFlatNumber(),
                flat.getOwnerName());
    }
}
