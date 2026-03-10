package com.society.backend.flat.service;

import com.society.backend.flat.dto.request.TenantRequest;
import com.society.backend.flat.dto.response.TenantResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Tenant;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.flat.repository.TenantRepository;
import com.society.backend.common.service.RoleService;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.UserRepository;
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
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TenantResponse create(TenantRequest request, Long userId) {
        roleService.requireMember(userId);

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));

        Tenant tenant = new Tenant();
        tenant.setFlat(flat);
        tenant.setSociety(flat.getSociety());
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
        tenant.setUser(resolveLinkedTenantUser(request.getUserId(), flat));

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
    public List<TenantResponse> getBySocietyId(Long societyId) {
        return tenantRepository.findBySocietyId(societyId).stream()
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
            tenant.setSociety(flat.getSociety());
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
        if (request.getUserId() != null) {
            tenant.setUser(resolveLinkedTenantUser(request.getUserId(), tenant.getFlat()));
        }

        Tenant saved = tenantRepository.save(tenant);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TenantResponse activate(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found"));

        tenant.setIsActive(true);
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
        if (tenant.getFlat().getSociety() != null) {
            response.setSocietyId(tenant.getFlat().getSociety().getId());
        }
        if (tenant.getUser() != null) {
            response.setUserId(tenant.getUser().getId());
            response.setUserName(tenant.getUser().getName());
        }
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

    private User resolveLinkedTenantUser(Long userId, Flat flat) {
        if (userId == null) {
            return null;
        }

        User linkedUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Linked user not found"));

        if (linkedUser.getRole() != Role.TENANT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only users with TENANT role can be linked");
        }

        if (linkedUser.getSociety() != null && flat.getSociety() != null
                && !linkedUser.getSociety().getId().equals(flat.getSociety().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Linked tenant user must belong to the same society");
        }

        if (linkedUser.getFlat() != null && !linkedUser.getFlat().getId().equals(flat.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Linked tenant user is assigned to a different unit");
        }

        return linkedUser;
    }
}
