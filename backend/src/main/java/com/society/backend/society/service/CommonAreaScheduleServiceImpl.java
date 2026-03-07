package com.society.backend.society.service;

import com.society.backend.society.dto.request.CommonAreaScheduleRequest;
import com.society.backend.society.dto.response.CommonAreaScheduleResponse;
import com.society.backend.society.entity.CommonAreaSchedule;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.society.repository.CommonAreaScheduleRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.common.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommonAreaScheduleServiceImpl implements CommonAreaScheduleService {

    private final CommonAreaScheduleRepository repository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public CommonAreaScheduleResponse create(Long userId, CommonAreaScheduleRequest request) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new RuntimeException("Society not found"));

        CommonAreaSchedule schedule = new CommonAreaSchedule();
        schedule.setSociety(society);
        mapFields(schedule, request);

        return toResponse(repository.save(schedule));
    }

    @Override
    @Transactional
    public CommonAreaScheduleResponse update(Long id, Long userId, CommonAreaScheduleRequest request) {
        roleService.requireStaff(userId);

        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = getUser(userId); roleService.enforceSocietyScope(user, schedule.getSociety().getId());

        mapFields(schedule, request);
        return toResponse(repository.save(schedule));
    }

    @Override
    public CommonAreaScheduleResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        return toResponse(schedule);
    }

    @Override
    public List<CommonAreaScheduleResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdOrderByAreaNameAsc(societyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<CommonAreaScheduleResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndStatusOrderByAreaNameAsc(societyId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<CommonAreaScheduleResponse> getByAreaType(Long societyId, String areaType, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndAreaTypeOrderByAreaNameAsc(societyId, areaType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<CommonAreaScheduleResponse> getByMaintenanceType(Long societyId, String maintenanceType, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndMaintenanceTypeOrderByAreaNameAsc(societyId, maintenanceType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<CommonAreaScheduleResponse> getOverdue(Long societyId, Long userId) {
        roleService.requireStaff(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndNextDueDateBeforeAndStatusOrderByNextDueDateAsc(
                        societyId, LocalDate.now(), "ACTIVE")
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommonAreaScheduleResponse markCompleted(Long id, Long userId) {
        roleService.requireStaff(userId);

        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = getUser(userId); roleService.enforceSocietyScope(user, schedule.getSociety().getId());

        schedule.setLastCompletedAt(LocalDateTime.now());

        // Auto-calculate next due date based on frequency
        LocalDate today = LocalDate.now();
        switch (schedule.getFrequency()) {
            case "DAILY" -> schedule.setNextDueDate(today.plusDays(1));
            case "WEEKLY" -> schedule.setNextDueDate(today.plusWeeks(1));
            case "BIWEEKLY" -> schedule.setNextDueDate(today.plusWeeks(2));
            case "MONTHLY" -> schedule.setNextDueDate(today.plusMonths(1));
            case "QUARTERLY" -> schedule.setNextDueDate(today.plusMonths(3));
            case "YEARLY" -> schedule.setNextDueDate(today.plusYears(1));
            default -> schedule.setNextDueDate(today.plusDays(1));
        }

        return toResponse(repository.save(schedule));
    }

    @Override
    @Transactional
    public CommonAreaScheduleResponse pause(Long id, Long userId) {
        roleService.requireStaff(userId);

        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = getUser(userId); roleService.enforceSocietyScope(user, schedule.getSociety().getId());

        schedule.setStatus("PAUSED");
        return toResponse(repository.save(schedule));
    }

    @Override
    @Transactional
    public CommonAreaScheduleResponse resume(Long id, Long userId) {
        roleService.requireStaff(userId);

        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = getUser(userId); roleService.enforceSocietyScope(user, schedule.getSociety().getId());

        schedule.setStatus("ACTIVE");
        return toResponse(repository.save(schedule));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId); roleService.enforceSocietyScope(user, societyId);

        Map<String, Long> counts = new HashMap<>();
        counts.put("active", repository.countBySocietyIdAndStatus(societyId, "ACTIVE"));
        counts.put("paused", repository.countBySocietyIdAndStatus(societyId, "PAUSED"));
        long overdue = repository.findBySocietyIdAndNextDueDateBeforeAndStatusOrderByNextDueDateAsc(
                societyId, LocalDate.now(), "ACTIVE").size();
        counts.put("overdue", overdue);
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);

        CommonAreaSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = getUser(userId); roleService.enforceSocietyScope(user, schedule.getSociety().getId());

        repository.delete(schedule);
    }

    private void mapFields(CommonAreaSchedule schedule, CommonAreaScheduleRequest req) {
        schedule.setAreaName(req.getAreaName());
        schedule.setAreaType(req.getAreaType());
        schedule.setDescription(req.getDescription());
        schedule.setMaintenanceType(req.getMaintenanceType());
        schedule.setFrequency(req.getFrequency());
        schedule.setDayOfWeek(req.getDayOfWeek());
        schedule.setDayOfMonth(req.getDayOfMonth());
        schedule.setTimeSlot(req.getTimeSlot());
        schedule.setAssignedTo(req.getAssignedTo());
        schedule.setVendorName(req.getVendorName());
        schedule.setNextDueDate(req.getNextDueDate());
        schedule.setCostPerService(req.getCostPerService());
        schedule.setNotes(req.getNotes());
    }

    private CommonAreaScheduleResponse toResponse(CommonAreaSchedule s) {
        return CommonAreaScheduleResponse.builder()
                .id(s.getId())
                .societyId(s.getSociety().getId())
                .areaName(s.getAreaName())
                .areaType(s.getAreaType())
                .description(s.getDescription())
                .maintenanceType(s.getMaintenanceType())
                .frequency(s.getFrequency())
                .dayOfWeek(s.getDayOfWeek())
                .dayOfMonth(s.getDayOfMonth())
                .timeSlot(s.getTimeSlot())
                .assignedTo(s.getAssignedTo())
                .vendorName(s.getVendorName())
                .status(s.getStatus())
                .lastCompletedAt(s.getLastCompletedAt())
                .nextDueDate(s.getNextDueDate())
                .costPerService(s.getCostPerService())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
