package com.society.backend.service.tenant;

import com.society.backend.dto.tenant.TenantRequest;
import com.society.backend.dto.tenant.TenantResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Tenant;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.tenant.TenantRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public TenantResponse create(TenantRequest request, Long userId) {
        roleService.requireMember(userId);

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        Tenant tenant = new Tenant();
        tenant.setFlat(flat);
        tenant.setName(request.getName());
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setIdProofType(request.getIdProofType());
        tenant.setIdProofNumber(request.getIdProofNumber());
        tenant.setAgreementStartDate(request.getAgreementStartDate());
        tenant.setAgreementEndDate(request.getAgreementEndDate());
        tenant.setRentAmount(request.getRentAmount());
        tenant.setDepositAmount(request.getDepositAmount());
        tenant.setIsActive(true);

        Tenant saved = tenantRepository.save(tenant);
        return mapToResponse(saved);
    }

    @Override
    public TenantResponse getById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found"));
        return mapToResponse(tenant);
    }

    @Override
    public List<TenantResponse> getByFlatId(Long flatId) {
        return tenantRepository.findByFlatId(flatId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TenantResponse> getAll() {
        return tenantRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TenantResponse> getActive() {
        return tenantRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TenantResponse update(Long id, TenantRequest request, Long userId) {
        roleService.requireMember(userId);

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found"));

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            tenant.setFlat(flat);
        }

        if (request.getName() != null)
            tenant.setName(request.getName());
        if (request.getPhone() != null)
            tenant.setPhone(request.getPhone());
        if (request.getEmail() != null)
            tenant.setEmail(request.getEmail());
        if (request.getIdProofType() != null)
            tenant.setIdProofType(request.getIdProofType());
        if (request.getIdProofNumber() != null)
            tenant.setIdProofNumber(request.getIdProofNumber());
        if (request.getAgreementStartDate() != null)
            tenant.setAgreementStartDate(request.getAgreementStartDate());
        if (request.getAgreementEndDate() != null)
            tenant.setAgreementEndDate(request.getAgreementEndDate());
        if (request.getRentAmount() != null)
            tenant.setRentAmount(request.getRentAmount());
        if (request.getDepositAmount() != null)
            tenant.setDepositAmount(request.getDepositAmount());

        Tenant saved = tenantRepository.save(tenant);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TenantResponse deactivate(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found"));

        tenant.setIsActive(false);
        Tenant saved = tenantRepository.save(tenant);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        if (!tenantRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Tenant not found");
        }
        tenantRepository.deleteById(id);
    }

    private TenantResponse mapToResponse(Tenant tenant) {
        TenantResponse response = new TenantResponse();
        response.setId(tenant.getId());
        response.setFlatId(tenant.getFlat().getId());
        response.setFlatNumber(tenant.getFlat().getFlatNumber());
        response.setName(tenant.getName());
        response.setPhone(tenant.getPhone());
        response.setEmail(tenant.getEmail());
        response.setIdProofType(tenant.getIdProofType());
        response.setIdProofNumber(tenant.getIdProofNumber());
        response.setAgreementStartDate(tenant.getAgreementStartDate());
        response.setAgreementEndDate(tenant.getAgreementEndDate());
        response.setRentAmount(tenant.getRentAmount());
        response.setDepositAmount(tenant.getDepositAmount());
        response.setIsActive(tenant.getIsActive());
        response.setCreatedAt(tenant.getCreatedAt());
        return response;
    }
}
