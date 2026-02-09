package com.society.backend.service.organization;

import com.society.backend.dto.organization.OrganizationRequest;
import com.society.backend.dto.organization.OrganizationResponse;
import com.society.backend.entity.Organization;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.organization.OrganizationRepository;
import com.society.backend.repository.society.SocietyRepository;
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

    @Override
    public OrganizationResponse create(OrganizationRequest request) {
        Organization org = new Organization();
        mapRequestToEntity(request, org);
        Organization saved = organizationRepository.save(org);
        return toResponse(saved);
    }

    @Override
    public List<OrganizationResponse> getAll() {
        return organizationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrganizationResponse getById(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
        return toResponse(org);
    }

    @Override
    public OrganizationResponse update(Long id, OrganizationRequest request) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
        mapRequestToEntity(request, org);
        Organization saved = organizationRepository.save(org);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!organizationRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Organization not found");
        }
        organizationRepository.deleteById(id);
    }

    @Override
    public List<OrganizationResponse> getByOwnerEmail(String email) {
        return organizationRepository.findByOwnerEmail(email)
                .map(org -> List.of(toResponse(org)))
                .orElse(List.of());
    }

    private void mapRequestToEntity(OrganizationRequest request, Organization org) {
        org.setName(request.getName());
        org.setOwnerName(request.getOwnerName());
        org.setOwnerEmail(request.getOwnerEmail());
        org.setOwnerPhone(request.getOwnerPhone());
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
