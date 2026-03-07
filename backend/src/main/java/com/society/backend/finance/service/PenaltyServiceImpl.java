package com.society.backend.finance.service;

import com.society.backend.finance.dto.request.PenaltyRequest;
import com.society.backend.finance.dto.response.PenaltyResponse;
import com.society.backend.finance.entity.Penalty;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.finance.repository.PenaltyRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.finance.service.PenaltyService;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.society.backend.flat.entity.Wing;
@Service
@RequiredArgsConstructor
public class PenaltyServiceImpl implements PenaltyService {

    private final PenaltyRepository penaltyRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private PenaltyResponse toResponse(Penalty p) {
        return PenaltyResponse.builder()
                .id(p.getId()).societyId(p.getSociety().getId())
                .issuedToId(p.getIssuedTo().getId()).issuedToName(p.getIssuedTo().getName())
                .issuedById(p.getIssuedBy().getId()).issuedByName(p.getIssuedBy().getName())
                .flatNumber(p.getFlatNumber()).wing(p.getWing())
                .penaltyType(p.getPenaltyType()).title(p.getTitle()).description(p.getDescription())
                .amount(p.getAmount()).dueDate(p.getDueDate())
                .paymentStatus(p.getPaymentStatus()).paidAmount(p.getPaidAmount()).paidAt(p.getPaidAt())
                .status(p.getStatus()).waivedReason(p.getWaivedReason())
                .appealNotes(p.getAppealNotes()).adminNotes(p.getAdminNotes())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }

    @Override
    @Transactional
    public PenaltyResponse create(PenaltyRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        roleService.enforceSocietyScope(getUser(userId), request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId()).orElseThrow(() -> new RuntimeException("Society not found"));
        User issuedTo = userRepository.findById(request.getIssuedToId()).orElseThrow(() -> new RuntimeException("User not found"));

        Penalty p = new Penalty();
        p.setSociety(society);
        p.setIssuedTo(issuedTo);
        p.setIssuedBy(getUser(userId));
        p.setFlatNumber(request.getFlatNumber());
        p.setWing(request.getWing());
        p.setPenaltyType(request.getPenaltyType());
        p.setTitle(request.getTitle());
        p.setDescription(request.getDescription());
        p.setAmount(request.getAmount());
        p.setDueDate(request.getDueDate());
        if (request.getAdminNotes() != null) p.setAdminNotes(request.getAdminNotes());
        return toResponse(penaltyRepository.save(p));
    }

    @Override
    @Transactional
    public PenaltyResponse update(Long id, PenaltyRequest request, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        p.setPenaltyType(request.getPenaltyType());
        p.setTitle(request.getTitle());
        p.setDescription(request.getDescription());
        p.setAmount(request.getAmount());
        p.setDueDate(request.getDueDate());
        if (request.getAdminNotes() != null) p.setAdminNotes(request.getAdminNotes());
        return toResponse(penaltyRepository.save(p));
    }

    @Override
    public PenaltyResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        return toResponse(p);
    }

    @Override
    public List<PenaltyResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return penaltyRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PenaltyResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return penaltyRepository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PenaltyResponse> getByPaymentStatus(Long societyId, String paymentStatus, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return penaltyRepository.findBySocietyIdAndPaymentStatusOrderByCreatedAtDesc(societyId, paymentStatus).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PenaltyResponse> getByType(Long societyId, String penaltyType, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return penaltyRepository.findBySocietyIdAndPenaltyTypeOrderByCreatedAtDesc(societyId, penaltyType).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PenaltyResponse> getByUser(Long issuedToId, Long userId) {
        roleService.requireMember(userId);
        return penaltyRepository.findByIssuedToIdOrderByCreatedAtDesc(issuedToId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PenaltyResponse markPaid(Long id, Long userId) {
        roleService.requireMember(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        p.setPaymentStatus("PAID");
        p.setPaidAmount(p.getAmount());
        p.setPaidAt(LocalDateTime.now());
        return toResponse(penaltyRepository.save(p));
    }

    @Override
    @Transactional
    public PenaltyResponse waive(Long id, String reason, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        p.setStatus("WAIVED");
        p.setPaymentStatus("WAIVED");
        if (reason != null) p.setWaivedReason(reason);
        return toResponse(penaltyRepository.save(p));
    }

    @Override
    @Transactional
    public PenaltyResponse appeal(Long id, String notes, Long userId) {
        roleService.requireMember(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        p.setStatus("APPEALED");
        if (notes != null) p.setAppealNotes(notes);
        return toResponse(penaltyRepository.save(p));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("active", penaltyRepository.countBySocietyIdAndStatus(societyId, "ACTIVE"));
        counts.put("waived", penaltyRepository.countBySocietyIdAndStatus(societyId, "WAIVED"));
        counts.put("appealed", penaltyRepository.countBySocietyIdAndStatus(societyId, "APPEALED"));
        counts.put("unpaid", penaltyRepository.countBySocietyIdAndPaymentStatus(societyId, "UNPAID"));
        counts.put("paid", penaltyRepository.countBySocietyIdAndPaymentStatus(societyId, "PAID"));
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        Penalty p = penaltyRepository.findById(id).orElseThrow(() -> new RuntimeException("Penalty not found"));
        roleService.enforceSocietyScope(getUser(userId), p.getSociety().getId());
        penaltyRepository.delete(p);
    }
}
