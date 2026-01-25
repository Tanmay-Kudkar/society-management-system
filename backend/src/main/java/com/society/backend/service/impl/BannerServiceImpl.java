package com.society.backend.service.impl;

import com.society.backend.dto.BannerRequest;
import com.society.backend.dto.BannerResponse;
import com.society.backend.entity.Banner;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.BannerRepository;
import com.society.backend.repository.SocietyRepository;
import com.society.backend.service.BannerService;
import com.society.backend.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public BannerResponse create(BannerRequest request, Long userId) {
        roleService.requireMasterAdmin(userId);

        Banner banner = new Banner();

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            banner.setSociety(society);
        }

        banner.setTitle(request.getTitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setRedirectUrl(request.getRedirectUrl());
        banner.setStartDate(request.getStartDate());
        banner.setEndDate(request.getEndDate());
        banner.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        banner.setIsActive(true);

        Banner saved = bannerRepository.save(banner);
        return mapToResponse(saved);
    }

    @Override
    public BannerResponse getById(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Banner not found"));
        return mapToResponse(banner);
    }

    @Override
    public List<BannerResponse> getBySocietyId(Long societyId) {
        return bannerRepository.findBySocietyId(societyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BannerResponse> getActiveBanners(Long societyId) {
        return bannerRepository.findActiveBanners(societyId, LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BannerResponse> getAll() {
        return bannerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BannerResponse update(Long id, BannerRequest request, Long userId) {
        roleService.requireMasterAdmin(userId);

        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Banner not found"));

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            banner.setSociety(society);
        }

        if (request.getTitle() != null)
            banner.setTitle(request.getTitle());
        if (request.getImageUrl() != null)
            banner.setImageUrl(request.getImageUrl());
        if (request.getRedirectUrl() != null)
            banner.setRedirectUrl(request.getRedirectUrl());
        if (request.getStartDate() != null)
            banner.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            banner.setEndDate(request.getEndDate());
        if (request.getDisplayOrder() != null)
            banner.setDisplayOrder(request.getDisplayOrder());

        Banner saved = bannerRepository.save(banner);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BannerResponse deactivate(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Banner not found"));

        banner.setIsActive(false);
        Banner saved = bannerRepository.save(banner);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireMasterAdmin(userId);

        if (!bannerRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Banner not found");
        }
        bannerRepository.deleteById(id);
    }

    private BannerResponse mapToResponse(Banner banner) {
        BannerResponse response = new BannerResponse();
        response.setId(banner.getId());

        if (banner.getSociety() != null) {
            response.setSocietyId(banner.getSociety().getId());
            response.setSocietyName(banner.getSociety().getName());
        }

        response.setTitle(banner.getTitle());
        response.setImageUrl(banner.getImageUrl());
        response.setRedirectUrl(banner.getRedirectUrl());
        response.setStartDate(banner.getStartDate());
        response.setEndDate(banner.getEndDate());
        response.setDisplayOrder(banner.getDisplayOrder());
        response.setIsActive(banner.getIsActive());
        response.setCreatedAt(banner.getCreatedAt());
        return response;
    }
}
