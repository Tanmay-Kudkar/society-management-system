package com.society.backend.society.service;

import com.society.backend.society.dto.request.SocietyRuleRequest;
import com.society.backend.society.dto.response.SocietyRuleResponse;
import com.society.backend.society.entity.Society;
import com.society.backend.society.entity.SocietyRule;
import com.society.backend.user.entity.User;
import com.society.backend.society.repository.SocietyRuleRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.common.service.RoleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SocietyRuleServiceImpl implements SocietyRuleService {

    private final SocietyRuleRepository repo;
    private final SocietyRepository societyRepo;
    private final UserRepository userRepo;
    private final RoleService roleService;

    private User getUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private SocietyRuleResponse toResponse(SocietyRule r) {
        return SocietyRuleResponse.builder()
                .id(r.getId())
                .societyId(r.getSociety().getId())
                .createdById(r.getCreatedBy().getId())
                .createdByName(r.getCreatedBy().getName())
                .title(r.getTitle())
                .category(r.getCategory())
                .description(r.getDescription())
                .content(r.getContent())
                .effectiveDate(r.getEffectiveDate())
                .expiryDate(r.getExpiryDate())
                .version(r.getVersion())
                .isActive(r.getIsActive())
                .isMandatory(r.getIsMandatory())
                .attachmentUrl(r.getAttachmentUrl())
                .sortOrder(r.getSortOrder())
                .approvedByName(r.getApprovedBy() != null ? r.getApprovedBy().getName() : null)
                .approvedAt(r.getApprovedAt())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private void applyFields(SocietyRule r, SocietyRuleRequest req) {
        r.setTitle(req.getTitle());
        r.setCategory(req.getCategory());
        r.setDescription(req.getDescription());
        r.setContent(req.getContent());
        r.setEffectiveDate(req.getEffectiveDate());
        r.setExpiryDate(req.getExpiryDate());
        r.setVersion(req.getVersion() != null ? req.getVersion() : "1.0");
        r.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        r.setIsMandatory(req.getIsMandatory() != null ? req.getIsMandatory() : false);
        r.setAttachmentUrl(req.getAttachmentUrl());
        r.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
    }

    @Override
    public SocietyRuleResponse create(SocietyRuleRequest request, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, request.getSocietyId());

        Society society = societyRepo.findById(request.getSocietyId())
                .orElseThrow(() -> new EntityNotFoundException("Society not found"));

        SocietyRule r = new SocietyRule();
        r.setSociety(society);
        r.setCreatedBy(user);
        applyFields(r, request);
        r.setStatus("DRAFT");
        return toResponse(repo.save(r));
    }

    @Override
    public SocietyRuleResponse update(Long id, SocietyRuleRequest request, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        applyFields(r, request);
        return toResponse(repo.save(r));
    }

    @Override
    @Transactional(readOnly = true)
    public SocietyRuleResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        return toResponse(r);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SocietyRuleResponse> getBySociety(Long societyId, String status, String category, Pageable pageable, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Page<SocietyRule> page;
        if (status != null && !status.isEmpty()) {
            page = repo.findBySocietyIdAndStatus(societyId, status, pageable);
        } else if (category != null && !category.isEmpty()) {
            page = repo.findBySocietyIdAndCategory(societyId, category, pageable);
        } else {
            page = repo.findBySocietyId(societyId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    public void delete(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        repo.delete(r);
    }

    @Override
    public SocietyRuleResponse publish(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        r.setStatus("PUBLISHED");
        r.setIsActive(true);
        return toResponse(repo.save(r));
    }

    @Override
    public SocietyRuleResponse archive(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        r.setStatus("ARCHIVED");
        r.setIsActive(false);
        return toResponse(repo.save(r));
    }

    @Override
    public SocietyRuleResponse approve(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        User user = getUser(userId);
        SocietyRule r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Society rule not found"));
        roleService.enforceSocietyScope(user, r.getSociety().getId());
        r.setStatus("APPROVED");
        r.setApprovedBy(user);
        r.setApprovedAt(LocalDateTime.now());
        return toResponse(repo.save(r));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Map<String, Long> counts = new HashMap<>();
        counts.put("draft", repo.countBySocietyIdAndStatus(societyId, "DRAFT"));
        counts.put("published", repo.countBySocietyIdAndStatus(societyId, "PUBLISHED"));
        counts.put("approved", repo.countBySocietyIdAndStatus(societyId, "APPROVED"));
        counts.put("archived", repo.countBySocietyIdAndStatus(societyId, "ARCHIVED"));
        counts.put("active", repo.countBySocietyIdAndIsActive(societyId, true));
        counts.put("mandatory", repo.countBySocietyIdAndIsMandatory(societyId, true));
        return counts;
    }
}
