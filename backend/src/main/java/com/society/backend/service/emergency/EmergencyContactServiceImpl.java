package com.society.backend.service.emergency;

import com.society.backend.dto.emergency.EmergencyContactRequest;
import com.society.backend.dto.emergency.EmergencyContactResponse;
import com.society.backend.entity.EmergencyContact;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.emergency.EmergencyContactRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyContactServiceImpl implements EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public EmergencyContactResponse create(EmergencyContactRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        EmergencyContact contact = new EmergencyContact();
        contact.setSociety(society);
        contact.setContactType(request.getContactType());
        contact.setName(request.getName());
        contact.setPhone(request.getPhone());
        contact.setAlternatePhone(request.getAlternatePhone());
        contact.setAddress(request.getAddress());
        contact.setNotes(request.getNotes());
        contact.setIsActive(true);

        EmergencyContact saved = emergencyContactRepository.save(contact);
        return mapToResponse(saved);
    }

    @Override
    public EmergencyContactResponse getById(Long id) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found"));
        return mapToResponse(contact);
    }

    @Override
    public List<EmergencyContactResponse> getBySocietyId(Long societyId) {
        return emergencyContactRepository.findBySocietyIdAndIsActiveTrue(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EmergencyContactResponse> getByContactType(String contactType) {
        return emergencyContactRepository.findByContactType(contactType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EmergencyContactResponse> getAll() {
        return emergencyContactRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EmergencyContactResponse update(Long id, EmergencyContactRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found"));

        if (request.getContactType() != null)
            contact.setContactType(request.getContactType());
        if (request.getName() != null)
            contact.setName(request.getName());
        if (request.getPhone() != null)
            contact.setPhone(request.getPhone());
        if (request.getAlternatePhone() != null)
            contact.setAlternatePhone(request.getAlternatePhone());
        if (request.getAddress() != null)
            contact.setAddress(request.getAddress());
        if (request.getNotes() != null)
            contact.setNotes(request.getNotes());

        EmergencyContact saved = emergencyContactRepository.save(contact);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public EmergencyContactResponse deactivate(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found"));

        contact.setIsActive(false);
        EmergencyContact saved = emergencyContactRepository.save(contact);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        if (!emergencyContactRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found");
        }
        emergencyContactRepository.deleteById(id);
    }

    private EmergencyContactResponse mapToResponse(EmergencyContact contact) {
        EmergencyContactResponse response = new EmergencyContactResponse();
        response.setId(contact.getId());
        response.setSocietyId(contact.getSociety().getId());
        response.setSocietyName(contact.getSociety().getName());
        response.setContactType(contact.getContactType());
        response.setName(contact.getName());
        response.setPhone(contact.getPhone());
        response.setAlternatePhone(contact.getAlternatePhone());
        response.setAddress(contact.getAddress());
        response.setNotes(contact.getNotes());
        response.setIsActive(contact.getIsActive());
        response.setCreatedAt(contact.getCreatedAt());
        return response;
    }
}
