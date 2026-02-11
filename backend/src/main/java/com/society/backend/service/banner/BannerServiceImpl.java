package com.society.backend.service.banner;

import com.society.backend.dto.banner.BannerRequest;
import com.society.backend.dto.banner.BannerResponse;
import com.society.backend.entity.Banner;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.banner.BannerRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.service.common.RoleService;
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
            banner.setOrganization(society.getOrganization());
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
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return bannerRepository.findAll().stream()
                .filter(b -> {
                    if (currentUser.getRole() == com.society.backend.entity.Role.PLATFORM_OWNER) {
                        return true;
                    }
                    if (b.getSociety() == null) {
                        return true;
                    }
                    if (currentUser.getRole() == com.society.backend.entity.Role.ORGANIZATION_OWNER
                            && currentUser.getOrganization() != null) {
                        return b.getSociety().getOrganization() != null
                                && b.getSociety().getOrganization().getId().equals(currentUser.getOrganization().getId());
                    }
                    return currentUser.getSociety() != null
                            && b.getSociety().getId().equals(currentUser.getSociety().getId());
                })
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
            banner.setOrganization(society.getOrganization());
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
