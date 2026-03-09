package com.society.backend.vendor.service;

import com.society.backend.vendor.dto.request.ContractRequest;
import com.society.backend.vendor.dto.response.ContractResponse;
import com.society.backend.vendor.entity.Contract;
import com.society.backend.society.entity.Society;
import com.society.backend.vendor.entity.Vendor;
import com.society.backend.common.exception.ApiException;
import com.society.backend.vendor.repository.ContractRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.vendor.repository.VendorRepository;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final SocietyRepository societyRepository;
    private final VendorRepository vendorRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public ContractResponse create(ContractRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());

        Contract contract = new Contract();
        contract.setSociety(society);

        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
            contract.setVendor(vendor);
        }

        contract.setContractType(request.getContractType());
        contract.setTitle(request.getTitle());
        contract.setDescription(request.getDescription());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setReminderDays(request.getReminderDays() != null ? request.getReminderDays() : 30);
        contract.setDocumentUrl(request.getDocumentUrl());
        contract.setIsActive(true);

        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    @Override
    public ContractResponse getById(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (contract.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), contract.getSociety().getId());
        }
        return mapToResponse(contract);
    }

    @Override
    public List<ContractResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return contractRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractResponse> getByContractType(String contractType) {
        var currentUser = roleService.getCurrentUser();
        return contractRepository.findByContractType(contractType).stream()
                .filter(c -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return c.getSociety() != null && currentUser.getSociety() != null
                            && c.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractResponse> getExpiringSoon(Long societyId, int days) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        LocalDate targetDate = LocalDate.now().plusDays(days);
        return contractRepository.findExpiringSoonBySociety(societyId, targetDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return contractRepository.findAll().stream()
                .filter(c -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return c.getSociety() != null && currentUser.getSociety() != null
                            && c.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContractResponse update(Long id, ContractRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (contract.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), contract.getSociety().getId());
        }

        if (request.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
            contract.setVendor(vendor);
        }

        if (request.getContractType() != null)
            contract.setContractType(request.getContractType());
        if (request.getTitle() != null)
            contract.setTitle(request.getTitle());
        if (request.getDescription() != null)
            contract.setDescription(request.getDescription());
        if (request.getStartDate() != null)
            contract.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            contract.setEndDate(request.getEndDate());
        if (request.getReminderDays() != null)
            contract.setReminderDays(request.getReminderDays());
        if (request.getDocumentUrl() != null)
            contract.setDocumentUrl(request.getDocumentUrl());

        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ContractResponse deactivate(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (contract.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), contract.getSociety().getId());
        }

        contract.setIsActive(false);
        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (contract.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), contract.getSociety().getId());
        }
        contractRepository.deleteById(id);
    }

    private ContractResponse mapToResponse(Contract contract) {
        ContractResponse response = new ContractResponse();
        response.setId(contract.getId());
        response.setSocietyId(contract.getSociety().getId());
        response.setSocietyName(contract.getSociety().getName());

        if (contract.getVendor() != null) {
            response.setVendorId(contract.getVendor().getId());
            response.setVendorName(contract.getVendor().getName());
        }

        response.setContractType(contract.getContractType());
        response.setTitle(contract.getTitle());
        response.setDescription(contract.getDescription());
        response.setStartDate(contract.getStartDate());
        response.setEndDate(contract.getEndDate());
        response.setReminderDays(contract.getReminderDays());
        response.setDocumentUrl(contract.getDocumentUrl());
        response.setIsActive(contract.getIsActive());
        response.setIsExpiringSoon(contract.isExpiringSoon());
        response.setIsExpired(contract.isExpired());

        long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), contract.getEndDate());
        response.setDaysToExpiry((int) daysToExpiry);

        response.setCreatedAt(contract.getCreatedAt());
        return response;
    }
}
