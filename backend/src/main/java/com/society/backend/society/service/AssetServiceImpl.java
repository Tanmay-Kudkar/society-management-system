package com.society.backend.society.service;

import com.society.backend.society.dto.request.AssetRequest;
import com.society.backend.society.dto.response.AssetResponse;
import com.society.backend.society.entity.Asset;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.society.repository.AssetRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AssetServiceImpl implements AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public AssetServiceImpl(AssetRepository assetRepository, UserRepository userRepository,
            SocietyRepository societyRepository, RoleService roleService) {
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    public AssetResponse create(Long userId, AssetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(user, society.getId());

        Asset asset = new Asset();
        asset.setSociety(society);
        mapFields(asset, request);

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));
            asset.setAssignedTo(assignee);
            asset.setStatus("IN_USE");
        }

        return toResponse(assetRepository.save(asset));
    }

    @Override
    public AssetResponse update(Long id, Long userId, AssetRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        mapFields(asset, request);

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));
            asset.setAssignedTo(assignee);
        }

        return toResponse(assetRepository.save(asset));
    }

    @Override
    public AssetResponse getById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        return toResponse(asset);
    }

    @Override
    public List<AssetResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return assetRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<AssetResponse> getByStatus(Long societyId, String status) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return assetRepository.findBySocietyIdAndStatusOrderByAssetNameAsc(societyId, status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<AssetResponse> getByCategory(Long societyId, String category) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return assetRepository.findBySocietyIdAndCategoryOrderByAssetNameAsc(societyId, category).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public AssetResponse updateStatus(Long id, String status) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        asset.setStatus(status);
        return toResponse(assetRepository.save(asset));
    }

    @Override
    public AssetResponse assign(Long id, Long assignedToId) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        User assignee = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        asset.setAssignedTo(assignee);
        asset.setStatus("IN_USE");
        return toResponse(assetRepository.save(asset));
    }

    @Override
    public AssetResponse unassign(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        asset.setAssignedTo(null);
        asset.setStatus("AVAILABLE");
        return toResponse(assetRepository.save(asset));
    }

    @Override
    public List<AssetResponse> getLowStock(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return assetRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .filter(a -> a.getMinQuantity() != null && a.getMinQuantity() > 0 && a.getQuantity() <= a.getMinQuantity())
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getCounts(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        Map<String, Long> counts = new HashMap<>();
        counts.put("available", assetRepository.countBySocietyIdAndStatus(societyId, "AVAILABLE"));
        counts.put("inUse", assetRepository.countBySocietyIdAndStatus(societyId, "IN_USE"));
        counts.put("maintenance", assetRepository.countBySocietyIdAndStatus(societyId, "UNDER_MAINTENANCE"));
        counts.put("retired", assetRepository.countBySocietyIdAndStatus(societyId, "RETIRED"));
        return counts;
    }

    @Override
    public void delete(Long id, Long userId) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Asset not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), asset.getSociety().getId());
        assetRepository.deleteById(id);
    }

    private void mapFields(Asset asset, AssetRequest req) {
        asset.setAssetName(req.getAssetName());
        asset.setAssetCode(req.getAssetCode());
        asset.setCategory(req.getCategory());
        asset.setDescription(req.getDescription());
        asset.setLocation(req.getLocation());
        if (req.getCondition() != null) asset.setCondition(req.getCondition());
        asset.setPurchaseDate(req.getPurchaseDate());
        asset.setPurchaseCost(req.getPurchaseCost());
        asset.setCurrentValue(req.getCurrentValue());
        asset.setWarrantyExpiry(req.getWarrantyExpiry());
        asset.setVendorName(req.getVendorName());
        if (req.getQuantity() != null) asset.setQuantity(req.getQuantity());
        if (req.getMinQuantity() != null) asset.setMinQuantity(req.getMinQuantity());
        asset.setNotes(req.getNotes());
    }

    private AssetResponse toResponse(Asset a) {
        AssetResponse r = new AssetResponse();
        r.setId(a.getId());
        r.setSocietyId(a.getSociety().getId());
        r.setSocietyName(a.getSociety().getName());
        r.setAssetName(a.getAssetName());
        r.setAssetCode(a.getAssetCode());
        r.setCategory(a.getCategory());
        r.setDescription(a.getDescription());
        r.setLocation(a.getLocation());
        r.setStatus(a.getStatus());
        r.setCondition(a.getCondition());
        r.setPurchaseDate(a.getPurchaseDate());
        r.setPurchaseCost(a.getPurchaseCost());
        r.setCurrentValue(a.getCurrentValue());
        r.setWarrantyExpiry(a.getWarrantyExpiry());
        r.setVendorName(a.getVendorName());
        if (a.getAssignedTo() != null) {
            r.setAssignedToId(a.getAssignedTo().getId());
            r.setAssignedToName(a.getAssignedTo().getName());
        }
        r.setQuantity(a.getQuantity());
        r.setMinQuantity(a.getMinQuantity());
        r.setNotes(a.getNotes());
        r.setCreatedAt(a.getCreatedAt());
        r.setUpdatedAt(a.getUpdatedAt());
        return r;
    }
}
