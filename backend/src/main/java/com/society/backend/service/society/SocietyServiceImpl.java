package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRequest;
import com.society.backend.dto.society.SocietyResponse;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.society.SocietyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SocietyServiceImpl implements SocietyService {

    private final SocietyRepository societyRepository;

    public SocietyServiceImpl(SocietyRepository societyRepository) {
        this.societyRepository = societyRepository;
    }

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
    }

    private SocietyResponse toResponse(Society society) {
        return new SocietyResponse(
                society.getId(),
                society.getName(),
                society.getAddress(),
                society.getCity(),
                society.getState(),
                society.getPincode(),
                society.getRegistrationNumber(),
                society.getEmail(),
                society.getPhone());
    }
}
