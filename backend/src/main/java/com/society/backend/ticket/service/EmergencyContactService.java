package com.society.backend.ticket.service;

import com.society.backend.ticket.dto.EmergencyContactRequest;
import com.society.backend.ticket.dto.EmergencyContactResponse;

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
