package com.society.backend.service;

import com.society.backend.dto.PetRegistrationRequest;
import com.society.backend.dto.PetRegistrationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface PetRegistrationService {

    PetRegistrationResponse create(PetRegistrationRequest request, Long userId);

    PetRegistrationResponse update(Long id, PetRegistrationRequest request, Long userId);

    PetRegistrationResponse getById(Long id, Long userId);

    Page<PetRegistrationResponse> getBySociety(Long societyId, String status, String petType, Pageable pageable, Long userId);

    void delete(Long id, Long userId);

    PetRegistrationResponse approve(Long id, Long userId);

    PetRegistrationResponse reject(Long id, String reason, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);
}
