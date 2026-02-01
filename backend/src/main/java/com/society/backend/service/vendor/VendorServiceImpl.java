package com.society.backend.service.vendor;

import com.society.backend.dto.vendor.VendorRequest;
import com.society.backend.dto.vendor.VendorResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.Vendor;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.vendor.VendorRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

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

        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    public VendorResponse getById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
        return mapToResponse(vendor);
    }

    @Override
    public List<VendorResponse> getBySocietyId(Long societyId) {
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
        return vendorRepository.findByServiceType(serviceType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VendorResponse> getAll() {
        return vendorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VendorResponse update(Long id, VendorRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
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

        vendor.setIsActive(false);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        if (!vendorRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Vendor not found");
        }
        vendorRepository.deleteById(id);
    }

    @Override
    @Transactional
    public VendorResponse approveVendor(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));

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

        vendor.setApprovalStatus("REJECTED");
        vendor.setIsActive(false);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    public List<VendorResponse> getPendingVendors(Long societyId) {
        List<Vendor> vendors;
        if (societyId != null) {
            vendors = vendorRepository.findAll().stream()
                    .filter(v -> "PENDING".equals(v.getApprovalStatus()))
                    .filter(v -> v.getSociety() != null && v.getSociety().getId().equals(societyId))
                    .toList();
        } else {
            vendors = vendorRepository.findAll().stream()
                    .filter(v -> "PENDING".equals(v.getApprovalStatus()))
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
        return response;
    }
}
