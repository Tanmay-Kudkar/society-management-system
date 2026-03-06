package com.society.backend.society.service;

import com.society.backend.society.dto.AssetRequest;
import com.society.backend.society.dto.AssetResponse;

import java.util.List;
import java.util.Map;

public interface AssetService {
    AssetResponse create(Long userId, AssetRequest request);
    AssetResponse update(Long id, Long userId, AssetRequest request);
    AssetResponse getById(Long id);
    List<AssetResponse> getBySociety(Long societyId);
    List<AssetResponse> getByStatus(Long societyId, String status);
    List<AssetResponse> getByCategory(Long societyId, String category);
    AssetResponse updateStatus(Long id, String status);
    AssetResponse assign(Long id, Long assignedToId);
    AssetResponse unassign(Long id);
    List<AssetResponse> getLowStock(Long societyId);
    Map<String, Long> getCounts(Long societyId);
    void delete(Long id, Long userId);
}
