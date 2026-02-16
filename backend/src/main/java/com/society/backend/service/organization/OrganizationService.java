package com.society.backend.service.organization;

import com.society.backend.dto.organization.OrganizationRequest;
import com.society.backend.dto.organization.OrganizationResponse;

import java.util.List;

public interface OrganizationService {

    OrganizationResponse create(OrganizationRequest request);

    List<OrganizationResponse> getAll();

    OrganizationResponse getById(Long id);

    OrganizationResponse update(Long id, OrganizationRequest request);

    void delete(Long id, boolean force);

    List<OrganizationResponse> getByOwnerEmail(String email);
}
