package com.society.backend.service.impl;

import com.society.backend.dto.request.MoveRecordRequest;
import com.society.backend.dto.response.MoveRecordResponse;
import com.society.backend.entity.MoveRecord;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.repository.MoveRecordRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.MoveRecordService;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MoveRecordServiceImpl implements MoveRecordService {

    private final MoveRecordRepository moveRecordRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private MoveRecordResponse toResponse(MoveRecord m) {
        return MoveRecordResponse.builder()
                .id(m.getId())
                .societyId(m.getSociety().getId())
                .userId(m.getUser().getId())
                .userName(m.getUser().getName())
                .flatNumber(m.getFlatNumber())
                .wing(m.getWing())
                .moveType(m.getMoveType())
                .moveDate(m.getMoveDate())
                .scheduledTime(m.getScheduledTime())
                .actualTime(m.getActualTime())
                .vehicleNumber(m.getVehicleNumber())
                .vehicleType(m.getVehicleType())
                .moversCompany(m.getMoversCompany())
                .moversPhone(m.getMoversPhone())
                .numberOfHelpers(m.getNumberOfHelpers())
                .itemsDescription(m.getItemsDescription())
                .elevatorRequired(m.getElevatorRequired())
                .depositAmount(m.getDepositAmount())
                .depositStatus(m.getDepositStatus())
                .status(m.getStatus())
                .adminNotes(m.getAdminNotes())
                .inspectionDone(m.getInspectionDone())
                .damageReported(m.getDamageReported())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public MoveRecordResponse create(MoveRecordRequest request, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new RuntimeException("Society not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        MoveRecord m = new MoveRecord();
        m.setSociety(society);
        m.setUser(user);
        applyFields(m, request);
        return toResponse(moveRecordRepository.save(m));
    }

    @Override
    @Transactional
    public MoveRecordResponse update(Long id, MoveRecordRequest request, Long userId) {
        roleService.requireMember(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        applyFields(m, request);
        return toResponse(moveRecordRepository.save(m));
    }

    private void applyFields(MoveRecord m, MoveRecordRequest r) {
        m.setFlatNumber(r.getFlatNumber());
        m.setWing(r.getWing());
        m.setMoveType(r.getMoveType());
        m.setMoveDate(r.getMoveDate());
        m.setScheduledTime(r.getScheduledTime());
        if (r.getActualTime() != null) m.setActualTime(r.getActualTime());
        m.setVehicleNumber(r.getVehicleNumber());
        m.setVehicleType(r.getVehicleType());
        m.setMoversCompany(r.getMoversCompany());
        m.setMoversPhone(r.getMoversPhone());
        if (r.getNumberOfHelpers() != null) m.setNumberOfHelpers(r.getNumberOfHelpers());
        m.setItemsDescription(r.getItemsDescription());
        if (r.getElevatorRequired() != null) m.setElevatorRequired(r.getElevatorRequired());
        if (r.getDepositAmount() != null) m.setDepositAmount(r.getDepositAmount());
        if (r.getDepositStatus() != null) m.setDepositStatus(r.getDepositStatus());
        if (r.getAdminNotes() != null) m.setAdminNotes(r.getAdminNotes());
        if (r.getInspectionDone() != null) m.setInspectionDone(r.getInspectionDone());
        if (r.getDamageReported() != null) m.setDamageReported(r.getDamageReported());
    }

    @Override
    public MoveRecordResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        return toResponse(m);
    }

    @Override
    public List<MoveRecordResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return moveRecordRepository.findBySocietyIdOrderByMoveDateDesc(societyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MoveRecordResponse> getByType(Long societyId, String moveType, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return moveRecordRepository.findBySocietyIdAndMoveTypeOrderByMoveDateDesc(societyId, moveType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MoveRecordResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return moveRecordRepository.findBySocietyIdAndStatusOrderByMoveDateDesc(societyId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MoveRecordResponse> getByDate(Long societyId, LocalDate date, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return moveRecordRepository.findBySocietyIdAndMoveDateOrderByScheduledTime(societyId, date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MoveRecordResponse> getByUser(Long targetUserId, Long userId) {
        roleService.requireMember(userId);
        return moveRecordRepository.findByUserIdOrderByMoveDateDesc(targetUserId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MoveRecordResponse markInProgress(Long id, Long userId) {
        roleService.requireMember(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        m.setStatus("IN_PROGRESS");
        return toResponse(moveRecordRepository.save(m));
    }

    @Override
    @Transactional
    public MoveRecordResponse markCompleted(Long id, Long userId) {
        roleService.requireMember(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        m.setStatus("COMPLETED");
        return toResponse(moveRecordRepository.save(m));
    }

    @Override
    @Transactional
    public MoveRecordResponse markCancelled(Long id, Long userId) {
        roleService.requireMember(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        m.setStatus("CANCELLED");
        return toResponse(moveRecordRepository.save(m));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("scheduled", moveRecordRepository.countBySocietyIdAndStatus(societyId, "SCHEDULED"));
        counts.put("inProgress", moveRecordRepository.countBySocietyIdAndStatus(societyId, "IN_PROGRESS"));
        counts.put("completed", moveRecordRepository.countBySocietyIdAndStatus(societyId, "COMPLETED"));
        counts.put("moveIn", moveRecordRepository.countBySocietyIdAndMoveType(societyId, "MOVE_IN"));
        counts.put("moveOut", moveRecordRepository.countBySocietyIdAndMoveType(societyId, "MOVE_OUT"));
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        MoveRecord m = moveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Move record not found"));
        roleService.enforceSocietyScope(getUser(userId), m.getSociety().getId());
        moveRecordRepository.delete(m);
    }
}
