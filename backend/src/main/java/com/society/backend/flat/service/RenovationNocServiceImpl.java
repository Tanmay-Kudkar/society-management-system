package com.society.backend.flat.service;

import com.society.backend.dto.request.RenovationNocRequest;
import com.society.backend.dto.response.RenovationNocResponse;
import com.society.backend.entity.RenovationNoc;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.flat.repository.RenovationNocRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.flat.service.RenovationNocService;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RenovationNocServiceImpl implements RenovationNocService {

    private final RenovationNocRepository renovationNocRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private RenovationNocResponse toResponse(RenovationNoc n) {
        RenovationNocResponse.RenovationNocResponseBuilder b = RenovationNocResponse.builder()
                .id(n.getId())
                .societyId(n.getSociety().getId())
                .requestedById(n.getRequestedBy().getId())
                .requestedByName(n.getRequestedBy().getName())
                .flatNumber(n.getFlatNumber())
                .wing(n.getWing())
                .renovationType(n.getRenovationType())
                .description(n.getDescription())
                .contractorName(n.getContractorName())
                .contractorPhone(n.getContractorPhone())
                .estimatedStartDate(n.getEstimatedStartDate())
                .estimatedEndDate(n.getEstimatedEndDate())
                .actualStartDate(n.getActualStartDate())
                .actualEndDate(n.getActualEndDate())
                .estimatedCost(n.getEstimatedCost())
                .depositAmount(n.getDepositAmount())
                .depositStatus(n.getDepositStatus())
                .status(n.getStatus())
                .rejectionReason(n.getRejectionReason())
                .termsAccepted(n.getTermsAccepted())
                .adminNotes(n.getAdminNotes())
                .approvedAt(n.getApprovedAt())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt());

        if (n.getApprovedBy() != null) {
            b.approvedById(n.getApprovedBy().getId());
            b.approvedByName(n.getApprovedBy().getName());
        }
        return b.build();
    }

    @Override
    @Transactional
    public RenovationNocResponse create(RenovationNocRequest request, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new RuntimeException("Society not found"));
        User requestedBy = userRepository.findById(request.getRequestedById())
                .orElseThrow(() -> new RuntimeException("Requested-by user not found"));

        RenovationNoc n = new RenovationNoc();
        n.setSociety(society);
        n.setRequestedBy(requestedBy);
        applyFields(n, request);

        return toResponse(renovationNocRepository.save(n));
    }

    @Override
    @Transactional
    public RenovationNocResponse update(Long id, RenovationNocRequest request, Long userId) {
        roleService.requireMember(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());
        applyFields(n, request);
        return toResponse(renovationNocRepository.save(n));
    }

    private void applyFields(RenovationNoc n, RenovationNocRequest r) {
        n.setFlatNumber(r.getFlatNumber());
        n.setWing(r.getWing());
        n.setRenovationType(r.getRenovationType());
        n.setDescription(r.getDescription());
        n.setContractorName(r.getContractorName());
        n.setContractorPhone(r.getContractorPhone());
        n.setEstimatedStartDate(r.getEstimatedStartDate());
        n.setEstimatedEndDate(r.getEstimatedEndDate());
        if (r.getActualStartDate() != null) n.setActualStartDate(r.getActualStartDate());
        if (r.getActualEndDate() != null) n.setActualEndDate(r.getActualEndDate());
        n.setEstimatedCost(r.getEstimatedCost());
        if (r.getDepositAmount() != null) n.setDepositAmount(r.getDepositAmount());
        if (r.getDepositStatus() != null) n.setDepositStatus(r.getDepositStatus());
        if (r.getTermsAccepted() != null) n.setTermsAccepted(r.getTermsAccepted());
        if (r.getAdminNotes() != null) n.setAdminNotes(r.getAdminNotes());
    }

    @Override
    public RenovationNocResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());
        return toResponse(n);
    }

    @Override
    public List<RenovationNocResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return renovationNocRepository.findBySocietyIdOrderByCreatedAtDesc(societyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RenovationNocResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return renovationNocRepository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RenovationNocResponse> getByType(Long societyId, String renovationType, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return renovationNocRepository.findBySocietyIdAndRenovationTypeOrderByCreatedAtDesc(societyId, renovationType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RenovationNocResponse> getByUser(Long requestedById, Long userId) {
        roleService.requireMember(userId);
        return renovationNocRepository.findByRequestedByIdOrderByCreatedAtDesc(requestedById)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RenovationNocResponse approve(Long id, String adminNotes, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());

        n.setStatus("APPROVED");
        n.setApprovedBy(getUser(userId));
        n.setApprovedAt(LocalDateTime.now());
        if (adminNotes != null) n.setAdminNotes(adminNotes);
        return toResponse(renovationNocRepository.save(n));
    }

    @Override
    @Transactional
    public RenovationNocResponse reject(Long id, String reason, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());

        n.setStatus("REJECTED");
        if (reason != null) n.setRejectionReason(reason);
        return toResponse(renovationNocRepository.save(n));
    }

    @Override
    @Transactional
    public RenovationNocResponse markInProgress(Long id, Long userId) {
        roleService.requireMember(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());

        n.setStatus("IN_PROGRESS");
        n.setActualStartDate(LocalDate.now());
        return toResponse(renovationNocRepository.save(n));
    }

    @Override
    @Transactional
    public RenovationNocResponse markCompleted(Long id, Long userId) {
        roleService.requireMember(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());

        n.setStatus("COMPLETED");
        n.setActualEndDate(LocalDate.now());
        return toResponse(renovationNocRepository.save(n));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("pending", renovationNocRepository.countBySocietyIdAndStatus(societyId, "PENDING"));
        counts.put("approved", renovationNocRepository.countBySocietyIdAndStatus(societyId, "APPROVED"));
        counts.put("inProgress", renovationNocRepository.countBySocietyIdAndStatus(societyId, "IN_PROGRESS"));
        counts.put("completed", renovationNocRepository.countBySocietyIdAndStatus(societyId, "COMPLETED"));
        counts.put("rejected", renovationNocRepository.countBySocietyIdAndStatus(societyId, "REJECTED"));
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        RenovationNoc n = renovationNocRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Renovation NOC not found"));
        roleService.enforceSocietyScope(getUser(userId), n.getSociety().getId());
        renovationNocRepository.delete(n);
    }
}
