package com.society.backend.service.complaint;

import com.society.backend.dto.complaint.ComplaintRequest;
import com.society.backend.dto.complaint.ComplaintResponse;
import com.society.backend.entity.Complaint;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.complaint.ComplaintRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.common.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, UserRepository userRepository,
            SocietyRepository societyRepository, RoleService roleService) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    public ComplaintResponse create(Long userId, ComplaintRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setStatus("PENDING");

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
            complaint.setSociety(society);
            complaint.setOrganization(society.getOrganization());
        } else if (user.getSociety() != null) {
            complaint.setSociety(user.getSociety());
            complaint.setOrganization(user.getSociety().getOrganization());
        }

        if (complaint.getOrganization() == null && user.getOrganization() != null) {
            complaint.setOrganization(user.getOrganization());
        }

        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // PLATFORM_OWNER sees all complaints
        if (user.getRole().name().equals("PLATFORM_OWNER")) {
            return complaintRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        if (user.getRole().name().equals("ORGANIZATION_OWNER") && user.getOrganization() != null) {
            Long orgId = user.getOrganization().getId();
            return complaintRepository.findAll().stream()
                .filter(c -> c.getSociety() != null && c.getSociety().getOrganization() != null
                    && c.getSociety().getOrganization().getId().equals(orgId))
                .map(this::toResponse)
                .collect(Collectors.toList());
        }

        // Others see only complaints from their society
        if (user.getSociety() != null) {
            return complaintRepository.findBySocietyId(user.getSociety().getId()).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // No society, return empty
        return List.of();
    }

    @Override
    public List<ComplaintResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return complaintRepository.findBySocietyId(societyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByUser(Long userId) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() != com.society.backend.entity.Role.PLATFORM_OWNER) {
            if (!currentUser.getId().equals(userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot access other users' complaints");
            }
        }
        return complaintRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByStatus(String status) {
        return complaintRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        if (complaint.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), complaint.getSociety().getId());
        }
        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse updateStatus(Long id, String status, String resolution) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        complaint.setStatus(status);
        if (resolution != null) {
            complaint.setResolution(resolution);
        }
        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!complaintRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }
        complaintRepository.deleteById(id);
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setComplaintNumber(complaint.getComplaintNumber());
        response.setUserId(complaint.getUser().getId());
        response.setRaisedByName(complaint.getUser().getName());
        if (complaint.getSociety() != null) {
            response.setSocietyId(complaint.getSociety().getId());
            response.setSocietyName(complaint.getSociety().getName());
        }
        response.setSubject(complaint.getSubject());
        response.setDescription(complaint.getDescription());
        response.setCategory(complaint.getCategory());
        response.setStatus(complaint.getStatus());
        response.setResolution(complaint.getResolution());
        response.setCreatedAt(complaint.getCreatedAt());
        return response;
    }
}
