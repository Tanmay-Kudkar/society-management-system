package com.society.backend.service;

import com.society.backend.dto.EmergencyContactRequest;
import com.society.backend.dto.EmergencyContactResponse;

import java.util.List;

public interface EmergencyContactService {
    EmergencyContactResponse create(EmergencyContactRequest request, Long userId);

    EmergencyContactResponse getById(Long id);

    List<EmergencyContactResponse> getBySocietyId(Long societyId);

    List<EmergencyContactResponse> getByContactType(String contactType);

    List<EmergencyContactResponse> getAll();

    EmergencyContactResponse update(Long id, EmergencyContactRequest request, Long userId);

    EmergencyContactResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId);
}
