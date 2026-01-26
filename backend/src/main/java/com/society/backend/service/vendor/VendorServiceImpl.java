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

        Vendor vendor = new Vendor();

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            vendor.setSociety(society);
        }

        vendor.setName(request.getName());
        vendor.setServiceType(request.getServiceType());
        vendor.setPhone(request.getPhone());
        vendor.setEmail(request.getEmail());
        vendor.setAddress(request.getAddress());
        vendor.setGstNumber(request.getGstNumber());
        vendor.setPanNumber(request.getPanNumber());
        vendor.setBankName(request.getBankName());
        vendor.setAccountNumber(request.getAccountNumber());
        vendor.setIfscCode(request.getIfscCode());
        vendor.setIsCommon(request.getIsCommon() != null ? request.getIsCommon() : false);
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
        return vendorRepository.findByIsCommonTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
        if (request.getIsCommon() != null)
            vendor.setIsCommon(request.getIsCommon());

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
        roleService.requireMasterAdmin(userId);

        if (!vendorRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Vendor not found");
        }
        vendorRepository.deleteById(id);
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
        response.setPhone(vendor.getPhone());
        response.setEmail(vendor.getEmail());
        response.setAddress(vendor.getAddress());
        response.setGstNumber(vendor.getGstNumber());
        response.setPanNumber(vendor.getPanNumber());
        response.setBankName(vendor.getBankName());
        response.setAccountNumber(vendor.getAccountNumber());
        response.setIfscCode(vendor.getIfscCode());
        response.setIsCommon(vendor.getIsCommon());
        response.setIsActive(vendor.getIsActive());
        response.setCreatedAt(vendor.getCreatedAt());
        return response;
    }
}
