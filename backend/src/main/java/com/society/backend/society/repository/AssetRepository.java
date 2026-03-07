package com.society.backend.society.repository;

import com.society.backend.society.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
    List<Asset> findBySocietyIdAndStatusOrderByAssetNameAsc(Long societyId, String status);
    List<Asset> findBySocietyIdAndCategoryOrderByAssetNameAsc(Long societyId, String category);
    List<Asset> findByAssignedToIdOrderByAssetNameAsc(Long assignedToId);
    long countBySocietyIdAndStatus(Long societyId, String status);
    List<Asset> findBySocietyIdAndQuantityLessThanEqual(Long societyId, int quantity);
}
