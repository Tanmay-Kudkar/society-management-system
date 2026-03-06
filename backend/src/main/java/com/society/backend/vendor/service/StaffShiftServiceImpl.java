package com.society.backend.vendor.service;

import com.society.backend.dto.request.StaffShiftRequest;
import com.society.backend.dto.response.StaffShiftResponse;
import com.society.backend.entity.Society;
import com.society.backend.entity.StaffShift;
import com.society.backend.entity.User;
import com.society.backend.vendor.repository.StaffShiftRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.service.common.RoleService;
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
public class StaffShiftServiceImpl implements StaffShiftService {

    private final StaffShiftRepository repository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public StaffShiftResponse create(Long userId, StaffShiftRequest request) {
        roleService.requireStaff(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new RuntimeException("Society not found"));
        User staff = userRepository.findById(request.getStaffUserId())
                .orElseThrow(() -> new RuntimeException("Staff user not found"));

        StaffShift shift = new StaffShift();
        shift.setSociety(society);
        shift.setStaffUser(staff);
        shift.setShiftDate(request.getShiftDate());
        shift.setShiftType(request.getShiftType());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setLocation(request.getLocation());
        shift.setNotes(request.getNotes());
        if (request.getOvertimeHours() != null) shift.setOvertimeHours(request.getOvertimeHours());

        return toResponse(repository.save(shift));
    }

    @Override
    public StaffShiftResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        StaffShift shift = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        return toResponse(shift);
    }

    @Override
    public List<StaffShiftResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdOrderByShiftDateDesc(societyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffShiftResponse> getByDate(Long societyId, LocalDate date, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndShiftDateOrderByStartTimeAsc(societyId, date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffShiftResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndStatusOrderByShiftDateDesc(societyId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffShiftResponse> getByStaff(Long staffUserId, Long userId) {
        roleService.requireMember(userId);
        return repository.findByStaffUserIdOrderByShiftDateDesc(staffUserId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffShiftResponse> getByDateRange(Long societyId, LocalDate start, LocalDate end, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);
        return repository.findBySocietyIdAndShiftDateBetweenOrderByShiftDateAsc(societyId, start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StaffShiftResponse checkIn(Long id, Long userId) {
        roleService.requireStaff(userId);
        StaffShift shift = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        shift.setCheckInTime(LocalDateTime.now());
        shift.setStatus("CHECKED_IN");
        return toResponse(repository.save(shift));
    }

    @Override
    @Transactional
    public StaffShiftResponse checkOut(Long id, Long userId) {
        roleService.requireStaff(userId);
        StaffShift shift = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        shift.setCheckOutTime(LocalDateTime.now());
        shift.setStatus("COMPLETED");
        return toResponse(repository.save(shift));
    }

    @Override
    @Transactional
    public StaffShiftResponse markAbsent(Long id, Long userId) {
        roleService.requireStaff(userId);
        StaffShift shift = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        shift.setStatus("ABSENT");
        return toResponse(repository.save(shift));
    }

    @Override
    public Map<String, Long> getDayCounts(Long societyId, LocalDate date, Long userId) {
        roleService.requireMember(userId);
        User user = getUser(userId);
        roleService.enforceSocietyScope(user, societyId);
        Map<String, Long> counts = new HashMap<>();
        counts.put("scheduled", repository.countBySocietyIdAndShiftDateAndStatus(societyId, date, "SCHEDULED"));
        counts.put("checkedIn", repository.countBySocietyIdAndShiftDateAndStatus(societyId, date, "CHECKED_IN"));
        counts.put("completed", repository.countBySocietyIdAndShiftDateAndStatus(societyId, date, "COMPLETED"));
        counts.put("absent", repository.countBySocietyIdAndShiftDateAndStatus(societyId, date, "ABSENT"));
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        StaffShift shift = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        repository.delete(shift);
    }

    private StaffShiftResponse toResponse(StaffShift s) {
        return StaffShiftResponse.builder()
                .id(s.getId())
                .societyId(s.getSociety().getId())
                .staffUserId(s.getStaffUser().getId())
                .staffUserName(s.getStaffUser().getName())
                .shiftDate(s.getShiftDate())
                .shiftType(s.getShiftType())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .checkInTime(s.getCheckInTime())
                .checkOutTime(s.getCheckOutTime())
                .status(s.getStatus())
                .location(s.getLocation())
                .notes(s.getNotes())
                .overtimeHours(s.getOvertimeHours())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
