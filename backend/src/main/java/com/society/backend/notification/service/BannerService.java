package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.BannerRequest;
import com.society.backend.notification.dto.response.BannerResponse;

import java.util.List;

public interface BannerService {
    BannerResponse create(BannerRequest request, Long userId);

    BannerResponse getById(Long id);

    List<BannerResponse> getBySocietyId(Long societyId);

    List<BannerResponse> getActiveBanners(Long societyId);

    List<BannerResponse> getAll();

    BannerResponse update(Long id, BannerRequest request, Long userId);

    BannerResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId);
}
