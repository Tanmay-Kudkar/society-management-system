package com.society.backend.flat.service;

import com.society.backend.flat.dto.request.PetRegistrationRequest;
import com.society.backend.flat.dto.response.PetRegistrationResponse;
import com.society.backend.flat.entity.PetRegistration;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.flat.repository.PetRegistrationRepository;
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

import com.society.backend.flat.entity.Wing;
@Service
@RequiredArgsConstructor
@Transactional
public class PetRegistrationServiceImpl implements PetRegistrationService {

    private final PetRegistrationRepository repo;
    private final SocietyRepository societyRepo;
    private final UserRepository userRepo;
    private final RoleService roleService;

    private User getUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    /* ── helpers ── */
    private PetRegistrationResponse toResponse(PetRegistration p) {
        return PetRegistrationResponse.builder()
                .id(p.getId())
                .societyId(p.getSociety().getId())
                .ownerId(p.getOwner().getId())
                .ownerName(p.getOwner().getName())
                .flatNumber(p.getFlatNumber())
                .wing(p.getWing())
                .petName(p.getPetName())
                .petType(p.getPetType())
                .breed(p.getBreed())
                .color(p.getColor())
                .ageYears(p.getAgeYears())
                .gender(p.getGender())
                .weightKg(p.getWeightKg())
                .vaccinated(p.getVaccinated())
                .vaccinationDate(p.getVaccinationDate())
                .vaccinationExpiry(p.getVaccinationExpiry())
                .registrationNumber(p.getRegistrationNumber())
                .microchipId(p.getMicrochipId())
                .photoUrl(p.getPhotoUrl())
                .specialNotes(p.getSpecialNotes())
                .status(p.getStatus())
                .approvedByName(p.getApprovedBy() != null ? p.getApprovedBy().getName() : null)
                .approvedAt(p.getApprovedAt())
                .rejectedReason(p.getRejectedReason())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private void applyFields(PetRegistration p, PetRegistrationRequest r) {
        p.setFlatNumber(r.getFlatNumber());
        p.setWing(r.getWing());
        p.setPetName(r.getPetName());
        p.setPetType(r.getPetType());
        p.setBreed(r.getBreed());
        p.setColor(r.getColor());
        p.setAgeYears(r.getAgeYears());
        p.setGender(r.getGender());
        p.setWeightKg(r.getWeightKg());
        p.setVaccinated(r.getVaccinated() != null ? r.getVaccinated() : false);
        p.setVaccinationDate(r.getVaccinationDate());
        p.setVaccinationExpiry(r.getVaccinationExpiry());
        p.setRegistrationNumber(r.getRegistrationNumber());
        p.setMicrochipId(r.getMicrochipId());
        p.setPhotoUrl(r.getPhotoUrl());
        p.setSpecialNotes(r.getSpecialNotes());
    }

    /* ── CRUD ── */

    @Override
    public PetRegistrationResponse create(PetRegistrationRequest request, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, request.getSocietyId());

        Society society = societyRepo.findById(request.getSocietyId())
                .orElseThrow(() -> new EntityNotFoundException("Society not found"));
        User owner = userRepo.findById(request.getOwnerId())
                .orElseThrow(() -> new EntityNotFoundException("Owner not found"));

        PetRegistration p = new PetRegistration();
        p.setSociety(society);
        p.setOwner(owner);
        applyFields(p, request);
        p.setStatus("PENDING");
        return toResponse(repo.save(p));
    }

    @Override
    public PetRegistrationResponse update(Long id, PetRegistrationRequest request, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        PetRegistration p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet registration not found"));
        roleService.enforceSocietyScope(user, p.getSociety().getId());
        applyFields(p, request);
        return toResponse(repo.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public PetRegistrationResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        PetRegistration p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet registration not found"));
        roleService.enforceSocietyScope(user, p.getSociety().getId());
        return toResponse(p);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PetRegistrationResponse> getBySociety(Long societyId, String status, String petType, Pageable pageable, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Page<PetRegistration> page;
        if (status != null && !status.isEmpty()) {
            page = repo.findBySocietyIdAndStatus(societyId, status, pageable);
        } else if (petType != null && !petType.isEmpty()) {
            page = repo.findBySocietyIdAndPetType(societyId, petType, pageable);
        } else {
            page = repo.findBySocietyId(societyId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    public void delete(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        PetRegistration p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet registration not found"));
        roleService.enforceSocietyScope(user, p.getSociety().getId());
        repo.delete(p);
    }

    @Override
    public PetRegistrationResponse approve(Long id, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        PetRegistration p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet registration not found"));
        roleService.enforceSocietyScope(user, p.getSociety().getId());
        p.setStatus("APPROVED");
        p.setApprovedBy(user);
        p.setApprovedAt(LocalDateTime.now());
        return toResponse(repo.save(p));
    }

    @Override
    public PetRegistrationResponse reject(Long id, String reason, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        PetRegistration p = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pet registration not found"));
        roleService.enforceSocietyScope(user, p.getSociety().getId());
        p.setStatus("REJECTED");
        p.setRejectedReason(reason);
        return toResponse(repo.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        Map<String, Long> counts = new HashMap<>();
        counts.put("pending", repo.countBySocietyIdAndStatus(societyId, "PENDING"));
        counts.put("approved", repo.countBySocietyIdAndStatus(societyId, "APPROVED"));
        counts.put("rejected", repo.countBySocietyIdAndStatus(societyId, "REJECTED"));
        counts.put("vaccinated", repo.countBySocietyIdAndVaccinated(societyId, true));
        counts.put("dogs", repo.countBySocietyIdAndPetType(societyId, "DOG"));
        counts.put("cats", repo.countBySocietyIdAndPetType(societyId, "CAT"));
        return counts;
    }
}
