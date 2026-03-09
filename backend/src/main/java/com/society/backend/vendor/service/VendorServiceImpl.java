package com.society.backend.vendor.service;

import com.society.backend.vendor.dto.request.VendorRequest;
import com.society.backend.vendor.dto.response.VendorResponse;
import com.society.backend.user.entity.Role;
import com.society.backend.security.entity.SecurityLog;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.vendor.entity.Vendor;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.vendor.repository.VendorBillRepository;
import com.society.backend.vendor.repository.VendorRepository;
import com.society.backend.security.service.SecurityLogService;
import com.society.backend.common.service.ReferenceCleanupService;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final VendorBillRepository vendorBillRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;
    private final SecurityLogService securityLogService;
    private final ReferenceCleanupService referenceCleanupService;

    /**
     * Roles that trigger automatic vendor approval.
     * Master Admin, Society Admin, and other higher authority roles.
     */
    private static final Set<Role> AUTO_APPROVE_ROLES = Set.of(
            Role.MASTER_ADMIN, Role.SOCIETY_ADMIN,
            Role.CHAIRMAN, Role.SECRETARY
    );

    @Override
    @Transactional
    public VendorResponse create(VendorRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        // Society is required for all vendors (no common vendors)
        if (request.getSocietyId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Society is required for vendors");
        }

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());

        Vendor vendor = new Vendor();
        vendor.setSociety(society);
        vendor.setName(request.getName());
        vendor.setServiceType(request.getServiceType());
        vendor.setContactPerson(request.getContactPerson());
        vendor.setContactPersonPhone(request.getContactPersonPhone());
        vendor.setContactPersonEmail(request.getContactPersonEmail());
        vendor.setPhone(request.getPhone());
        vendor.setEmail(request.getEmail());
        vendor.setAddress(request.getAddress());
        vendor.setGstNumber(request.getGstNumber());
        vendor.setPanNumber(request.getPanNumber());
        vendor.setBankName(request.getBankName());
        vendor.setAccountNumber(request.getAccountNumber());
        vendor.setIfscCode(request.getIfscCode());
        vendor.setIsActive(true);

        // Auto-approval logic: higher authority roles get auto-approved
        User creator = roleService.getUser(userId);
        if (AUTO_APPROVE_ROLES.contains(creator.getRole())) {
            vendor.setApprovalStatus("APPROVED");
            log.info("Vendor '{}' auto-approved (created by {} with role {})",
                    request.getName(), creator.getEmail(), creator.getRole());
        } else {
            vendor.setApprovalStatus("PENDING");
            log.info("Vendor '{}' set to PENDING approval (created by {} with role {})",
                    request.getName(), creator.getEmail(), creator.getRole());
        }

        // Track who created the vendor
        vendor.setCreatedByUserId(creator.getId());
        vendor.setCreatedByRole(creator.getRole().name());

        Vendor saved = vendorRepository.save(vendor);

        // Create audit log entry for vendor creation
        try {
            SecurityLog auditLog = new SecurityLog();
            auditLog.setSocietyId(society.getId());
            auditLog.setType("SYSTEM");
            auditLog.setEvent(String.format("Vendor '%s' created by %s (%s). Status: %s",
                    saved.getName(), creator.getName(), creator.getRole(), saved.getApprovalStatus()));
            auditLog.setStatus("APPROVED".equals(saved.getApprovalStatus()) ? "Approved" : "Info");
            securityLogService.createLog(auditLog);
        } catch (Exception e) {
            log.warn("Failed to create audit log for vendor creation: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    public VendorResponse getById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), vendor.getSociety().getId());
        }
        return mapToResponse(vendor);
    }

    @Override
    public List<VendorResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return vendorRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorResponse> getCommonVendors() {
        // Common vendors concept removed - return empty list
        return List.of();
    }

    @Override
    public List<VendorResponse> getByServiceType(String serviceType) {
        var currentUser = roleService.getCurrentUser();
        return vendorRepository.findByServiceType(serviceType).stream()
                .filter(v -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) return true;
                    return v.getSociety() != null && currentUser.getSociety() != null
                            && v.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorResponse> getAll() {
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return vendorRepository.findAll().stream()
                .filter(v -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return v.getSociety() != null && currentUser.getSociety() != null
                            && v.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VendorResponse update(Long id, VendorRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        // Enforce scope on existing vendor's society
        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vendor.getSociety().getId());
        }

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(roleService.getUser(userId), society.getId());
            vendor.setSociety(society);
        }

        if (request.getName() != null)
            vendor.setName(request.getName());
        if (request.getServiceType() != null)
            vendor.setServiceType(request.getServiceType());
        if (request.getContactPerson() != null)
            vendor.setContactPerson(request.getContactPerson());
        if (request.getContactPersonPhone() != null)
            vendor.setContactPersonPhone(request.getContactPersonPhone());
        if (request.getContactPersonEmail() != null)
            vendor.setContactPersonEmail(request.getContactPersonEmail());
        if (request.getPhone() != null)
            vendor.setPhone(request.getPhone());
        if (request.getEmail() != null)
            vendor.setEmail(request.getEmail());
        if (request.getAddress() != null)
            vendor.setAddress(request.getAddress());
        if (request.getGstNumber() != null)
            vendor.setGstNumber(request.getGstNumber());
        if (request.getPanNumber() != null)
            vendor.setPanNumber(request.getPanNumber());
        if (request.getBankName() != null)
            vendor.setBankName(request.getBankName());
        if (request.getAccountNumber() != null)
            vendor.setAccountNumber(request.getAccountNumber());
        if (request.getIfscCode() != null)
            vendor.setIfscCode(request.getIfscCode());

        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public VendorResponse deactivate(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vendor.getSociety().getId());
        }

        vendor.setIsActive(false);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId, boolean force) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vendor.getSociety().getId());
        }

        // Check for linked records
        int billCount = vendorBillRepository.findByVendorId(id).size();
        if (!force && billCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    String.format("Cannot delete vendor '%s'. It has %d linked bill(s). Use force delete to auto-clean.",
                            vendor.getName(), billCount));
        }

        if (force) {
            referenceCleanupService.clearReferences("vendor_id", id, true, Set.of("vendors"));
        }

        vendorRepository.deleteById(id);
    }

    @Override
    @Transactional
    public VendorResponse approveVendor(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vendor.getSociety().getId());
        }

        vendor.setApprovalStatus("APPROVED");
        vendor.setIsActive(true);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public VendorResponse rejectVendor(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (vendor.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getUser(userId), vendor.getSociety().getId());
        }

        vendor.setApprovalStatus("REJECTED");
        vendor.setIsActive(false);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    public List<VendorResponse> getPendingVendors(Long societyId) {
        var currentUser = roleService.getCurrentUser();
        List<Vendor> vendors;
        if (societyId != null) {
            roleService.enforceSocietyScope(currentUser, societyId);
            vendors = vendorRepository.findAll().stream()
                    .filter(v -> "PENDING".equals(v.getApprovalStatus()))
                    .filter(v -> v.getSociety() != null && v.getSociety().getId().equals(societyId))
                    .toList();
        } else if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
            vendors = vendorRepository.findAll().stream()
                    .filter(v -> "PENDING".equals(v.getApprovalStatus()))
                    .toList();
        } else {
            vendors = vendorRepository.findAll().stream()
                    .filter(v -> "PENDING".equals(v.getApprovalStatus()))
                    .filter(v -> v.getSociety() != null && currentUser.getSociety() != null
                            && v.getSociety().getId().equals(currentUser.getSociety().getId()))
                    .toList();
        }
        return vendors.stream().map(this::mapToResponse).toList();
    }

    private VendorResponse mapToResponse(Vendor vendor) {
        VendorResponse response = new VendorResponse();
        response.setId(vendor.getId());

        if (vendor.getSociety() != null) {
            response.setSocietyId(vendor.getSociety().getId());
            response.setSocietyName(vendor.getSociety().getName());
        }

        response.setName(vendor.getName());
        response.setServiceType(vendor.getServiceType());
        response.setContactPerson(vendor.getContactPerson());
        response.setContactPersonPhone(vendor.getContactPersonPhone());
        response.setContactPersonEmail(vendor.getContactPersonEmail());
        response.setPhone(vendor.getPhone());
        response.setEmail(vendor.getEmail());
        response.setAddress(vendor.getAddress());
        response.setGstNumber(vendor.getGstNumber());
        response.setPanNumber(vendor.getPanNumber());
        response.setBankName(vendor.getBankName());
        response.setAccountNumber(vendor.getAccountNumber());
        response.setIfscCode(vendor.getIfscCode());
        response.setApprovalStatus(vendor.getApprovalStatus());
        response.setIsActive(vendor.getIsActive());
        response.setCreatedAt(vendor.getCreatedAt());
        response.setCreatedByUserId(vendor.getCreatedByUserId());
        response.setCreatedByRole(vendor.getCreatedByRole());
        return response;
    }
}
