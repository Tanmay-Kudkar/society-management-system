package com.society.backend.service.organization;

import com.society.backend.dto.organization.OrganizationRequest;
import com.society.backend.dto.organization.OrganizationResponse;
import com.society.backend.entity.Organization;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.organization.OrganizationRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    public OrganizationResponse create(OrganizationRequest request) {
        var currentUser = roleService.getCurrentUser();
        roleService.requireMasterAdmin(currentUser);

        Organization org = new Organization();
        mapRequestToEntity(request, org, true);
        Organization saved = organizationRepository.save(org);
        return toResponse(saved);
    }

    @Override
    public List<OrganizationResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (currentUser.getRole() == com.society.backend.entity.Role.PLATFORM_OWNER) {
            return organizationRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        if (currentUser.getRole() == com.society.backend.entity.Role.ORGANIZATION_OWNER
                && currentUser.getOrganization() != null) {
            return List.of(toResponse(currentUser.getOrganization()));
        }

        return List.of();
    }

    @Override
    public OrganizationResponse getById(Long id) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (currentUser.getRole() == com.society.backend.entity.Role.ORGANIZATION_OWNER) {
            roleService.enforceOrganizationScope(currentUser, id);
        }

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
        return toResponse(org);
    }

    @Override
    public OrganizationResponse update(Long id, OrganizationRequest request) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        boolean allowSubscriptionEdit = currentUser.getRole() == com.society.backend.entity.Role.PLATFORM_OWNER;
        if (!allowSubscriptionEdit) {
            roleService.enforceOrganizationScope(currentUser, id);
        }

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
        mapRequestToEntity(request, org, allowSubscriptionEdit);
        Organization saved = organizationRepository.save(org);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        var currentUser = roleService.getCurrentUser();
        roleService.requireMasterAdmin(currentUser);

        if (!organizationRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Organization not found");
        }
        organizationRepository.deleteById(id);
    }

    @Override
    public List<OrganizationResponse> getByOwnerEmail(String email) {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (currentUser.getRole() == com.society.backend.entity.Role.ORGANIZATION_OWNER
                && currentUser.getOrganization() != null) {
            if (!email.equalsIgnoreCase(currentUser.getOrganization().getOwnerEmail())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot access other organizations");
            }
        }

        return organizationRepository.findByOwnerEmail(email)
                .map(org -> List.of(toResponse(org)))
                .orElse(List.of());
    }

    private void mapRequestToEntity(OrganizationRequest request, Organization org, boolean allowSubscriptionEdit) {
        org.setName(request.getName());
        org.setOwnerName(request.getOwnerName());
        org.setOwnerEmail(request.getOwnerEmail());
        org.setOwnerPhone(request.getOwnerPhone());
        if (allowSubscriptionEdit) {
            if (request.getSubscriptionType() != null) {
                org.setSubscriptionType(request.getSubscriptionType());
            }
            if (request.getMaxSocieties() != null) {
                org.setMaxSocieties(request.getMaxSocieties());
            }
            if (request.getIsFoundingMember() != null) {
                org.setIsFoundingMember(request.getIsFoundingMember());
                if (request.getIsFoundingMember()) {
                    org.setSubscriptionType("LIFETIME");
                    org.setMaxSocieties(Integer.MAX_VALUE);
                }
            }
        }
    }

    private OrganizationResponse toResponse(Organization org) {
        OrganizationResponse response = new OrganizationResponse();
        response.setId(org.getId());
        response.setName(org.getName());
        response.setOwnerName(org.getOwnerName());
        response.setOwnerEmail(org.getOwnerEmail());
        response.setOwnerPhone(org.getOwnerPhone());
        response.setSubscriptionType(org.getSubscriptionType());
        response.setSubscriptionStatus(org.getSubscriptionStatus());
        response.setSubscriptionStartDate(org.getSubscriptionStartDate());
        response.setSubscriptionEndDate(org.getSubscriptionEndDate());
        response.setMaxSocieties(org.getMaxSocieties());
        response.setIsFoundingMember(org.getIsFoundingMember());
        response.setIsActive(org.getIsActive());
        response.setSocietyCount(societyRepository.countByOrganizationId(org.getId()));
        return response;
    }
}
