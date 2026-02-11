package com.society.backend.service.emergency;

import com.society.backend.dto.emergency.EmergencyContactRequest;
import com.society.backend.dto.emergency.EmergencyContactResponse;
import com.society.backend.entity.EmergencyContact;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.AccessDeniedException;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.emergency.EmergencyContactRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyContactServiceImpl implements EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public EmergencyContactResponse create(EmergencyContactRequest request, Long userId) {
        // Allow any registered member to create emergency contacts
        roleService.requireMember(userId);
        User user = roleService.getUser(userId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(user, society.getId());

        EmergencyContact contact = new EmergencyContact();
        contact.setSociety(society);
        contact.setOrganization(society.getOrganization());
        contact.setCreatedBy(user); // Track who created this contact
        contact.setContactType(request.getContactType());
        contact.setName(request.getName());
        contact.setPhone(request.getPhone());
        contact.setAlternatePhone(request.getAlternatePhone());
        contact.setAddress(request.getAddress());
        contact.setNotes(request.getNotes());
        contact.setIsActive(true);

        EmergencyContact saved = emergencyContactRepository.save(contact);
        log.info("User {} created emergency contact: {}", userId, saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public EmergencyContactResponse getById(Long id) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found"));
        if (contact.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), contact.getSociety().getId());
        }
        return mapToResponse(contact);
    }

    @Override
    public List<EmergencyContactResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
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
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return emergencyContactRepository.findAll().stream()
                .filter(c -> {
                    if (currentUser.getRole() == Role.PLATFORM_OWNER) {
                        return true;
                    }
                    if (currentUser.getRole() == Role.ORGANIZATION_OWNER
                            && currentUser.getOrganization() != null) {
                        return c.getSociety() != null && c.getSociety().getOrganization() != null
                                && c.getSociety().getOrganization().getId().equals(currentUser.getOrganization().getId());
                    }
                    return c.getSociety() != null && currentUser.getSociety() != null
                            && c.getSociety().getId().equals(currentUser.getSociety().getId());
                })
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
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency contact not found"));

        User user = roleService.getUser(userId);
        
        // Allow deletion if:
        // 1. User is admin/committee level, OR
        // 2. User is the creator of this contact
        boolean isAdminOrCommittee = isAdminOrCommitteeRole(user.getRole());
        boolean isCreator = contact.getCreatedBy() != null && contact.getCreatedBy().getId().equals(userId);
        
        if (!isAdminOrCommittee && !isCreator) {
            throw new AccessDeniedException("You can only delete emergency contacts you created");
        }
        
        emergencyContactRepository.deleteById(id);
        log.info("User {} deleted emergency contact: {}", userId, id);
    }
    
    /**
     * Check if the role is admin or committee level
     */
    private boolean isAdminOrCommitteeRole(Role role) {
        return role == Role.PLATFORM_OWNER || 
               role == Role.SOCIETY_ADMIN || 
               role == Role.CHAIRMAN || 
               role == Role.SECRETARY || 
               role == Role.TREASURER || 
               role == Role.COMMITTEE;
    }

    private EmergencyContactResponse mapToResponse(EmergencyContact contact) {
        EmergencyContactResponse response = new EmergencyContactResponse();
        response.setId(contact.getId());
        response.setSocietyId(contact.getSociety().getId());
        response.setSocietyName(contact.getSociety().getName());
        if (contact.getCreatedBy() != null) {
            response.setCreatedById(contact.getCreatedBy().getId());
            response.setCreatedByName(contact.getCreatedBy().getName());
        }
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
