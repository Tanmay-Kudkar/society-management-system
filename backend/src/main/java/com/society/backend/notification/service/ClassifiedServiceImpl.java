package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.ClassifiedRequest;
import com.society.backend.notification.dto.response.ClassifiedResponse;
import com.society.backend.notification.entity.Classified;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.notification.repository.ClassifiedRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import com.society.backend.flat.entity.Wing;
@Service
@RequiredArgsConstructor
@Transactional
public class ClassifiedServiceImpl implements ClassifiedService {

    private final ClassifiedRepository repo;
    private final SocietyRepository societyRepo;
    private final UserRepository userRepo;
    private final RoleService roleService;

    private User getUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private ClassifiedResponse toResponse(Classified c) {
        return ClassifiedResponse.builder()
                .id(c.getId())
                .societyId(c.getSociety().getId())
                .postedById(c.getPostedBy().getId())
                .postedByName(c.getPostedBy().getName())
                .flatNumber(c.getFlatNumber())
                .wing(c.getWing())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .listingType(c.getListingType())
                .price(c.getPrice())
                .negotiable(c.getNegotiable())
                .itemCondition(c.getItemCondition())
                .imageUrls(c.getImageUrls())
                .contactPhone(c.getContactPhone())
                .contactEmail(c.getContactEmail())
                .status(c.getStatus())
                .expiresAt(c.getExpiresAt())
                .flagged(c.getFlagged())
                .flagReason(c.getFlagReason())
                .views(c.getViews())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private void applyFields(Classified c, ClassifiedRequest r) {
        c.setFlatNumber(r.getFlatNumber());
        c.setWing(r.getWing());
        c.setTitle(r.getTitle());
        c.setDescription(r.getDescription());
        c.setCategory(r.getCategory());
        c.setListingType(r.getListingType());
        c.setPrice(r.getPrice());
        c.setNegotiable(r.getNegotiable() != null ? r.getNegotiable() : false);
        c.setItemCondition(r.getItemCondition());
        c.setImageUrls(r.getImageUrls());
        c.setContactPhone(r.getContactPhone());
        c.setContactEmail(r.getContactEmail());
        c.setExpiresAt(r.getExpiresAt());
    }

    @Override
    public ClassifiedResponse create(ClassifiedRequest request, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, request.getSocietyId());

        Society society = societyRepo.findById(request.getSocietyId())
                .orElseThrow(() -> new EntityNotFoundException("Society not found"));
        User poster = userRepo.findById(request.getPostedById())
                .orElseThrow(() -> new EntityNotFoundException("Poster not found"));

        Classified c = new Classified();
        c.setSociety(society);
        c.setPostedBy(poster);
        applyFields(c, request);
        c.setStatus("ACTIVE");
        return toResponse(repo.save(c));
    }

    @Override
    public ClassifiedResponse update(Long id, ClassifiedRequest request, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        applyFields(c, request);
        return toResponse(repo.save(c));
    }

    @Override
    @Transactional(readOnly = true)
    public ClassifiedResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        return toResponse(c);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassifiedResponse> getBySociety(Long societyId, String status, String category, String listingType, Pageable pageable, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Page<Classified> page;
        if (status != null && !status.isEmpty()) {
            page = repo.findBySocietyIdAndStatus(societyId, status, pageable);
        } else if (category != null && !category.isEmpty()) {
            page = repo.findBySocietyIdAndCategory(societyId, category, pageable);
        } else if (listingType != null && !listingType.isEmpty()) {
            page = repo.findBySocietyIdAndListingType(societyId, listingType, pageable);
        } else {
            page = repo.findBySocietyId(societyId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    public void delete(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        repo.delete(c);
    }

    @Override
    public ClassifiedResponse markSold(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        c.setStatus("SOLD");
        return toResponse(repo.save(c));
    }

    @Override
    public ClassifiedResponse markClosed(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        c.setStatus("CLOSED");
        return toResponse(repo.save(c));
    }

    @Override
    public ClassifiedResponse flag(Long id, String reason, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        c.setFlagged(true);
        c.setFlagReason(reason);
        return toResponse(repo.save(c));
    }

    @Override
    public ClassifiedResponse unflag(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        Classified c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classified not found"));
        roleService.enforceSocietyScope(user, c.getSociety().getId());
        c.setFlagged(false);
        c.setFlagReason(null);
        return toResponse(repo.save(c));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Map<String, Long> counts = new HashMap<>();
        counts.put("active", repo.countBySocietyIdAndStatus(societyId, "ACTIVE"));
        counts.put("sold", repo.countBySocietyIdAndStatus(societyId, "SOLD"));
        counts.put("closed", repo.countBySocietyIdAndStatus(societyId, "CLOSED"));
        counts.put("flagged", repo.countBySocietyIdAndFlagged(societyId, true));
        return counts;
    }
}
