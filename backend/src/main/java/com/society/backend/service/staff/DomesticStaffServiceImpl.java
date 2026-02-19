package com.society.backend.service.staff;

import com.society.backend.dto.staff.DomesticStaffRequest;
import com.society.backend.dto.staff.DomesticStaffResponse;
import com.society.backend.dto.staff.StaffAttendanceRequest;
import com.society.backend.dto.staff.StaffAttendanceResponse;
import com.society.backend.entity.DomesticStaff;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Society;
import com.society.backend.entity.StaffAttendance;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.staff.DomesticStaffRepository;
import com.society.backend.repository.staff.StaffAttendanceRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.common.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DomesticStaffServiceImpl implements DomesticStaffService {

    private final DomesticStaffRepository staffRepository;
    private final StaffAttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    public DomesticStaffServiceImpl(DomesticStaffRepository staffRepository,
            StaffAttendanceRepository attendanceRepository, UserRepository userRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository, RoleService roleService) {
        this.staffRepository = staffRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.roleService = roleService;
    }

    // --- Staff Management ---

    @Override
    public DomesticStaffResponse createStaff(Long userId, DomesticStaffRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
        } else if (user.getSociety() != null) {
            society = user.getSociety();
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
        }

        DomesticStaff staff = new DomesticStaff();
        staff.setName(request.getName());
        staff.setPhone(request.getPhone());
        staff.setStaffType(request.getStaffType());
        staff.setIdProofType(request.getIdProofType());
        staff.setIdProofNumber(request.getIdProofNumber());
        staff.setSociety(society);
        staff.setAddress(request.getAddress());

        DomesticStaff saved = staffRepository.save(staff);
        return toStaffResponse(saved);
    }

    @Override
    public List<DomesticStaffResponse> getAllStaff(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return staffRepository.findAll().stream()
                    .map(this::toStaffResponse).collect(Collectors.toList());
        }

        if (user.getSociety() != null) {
            return staffRepository.findBySocietyId(user.getSociety().getId()).stream()
                    .map(this::toStaffResponse).collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public List<DomesticStaffResponse> getStaffBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return staffRepository.findBySocietyId(societyId).stream()
                .map(this::toStaffResponse).collect(Collectors.toList());
    }

    @Override
    public List<DomesticStaffResponse> getActiveStaffBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return staffRepository.findBySocietyIdAndIsActiveTrue(societyId).stream()
                .map(this::toStaffResponse).collect(Collectors.toList());
    }

    @Override
    public List<DomesticStaffResponse> getStaffByType(Long societyId, String staffType) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return staffRepository.findBySocietyIdAndStaffType(societyId, staffType).stream()
                .map(this::toStaffResponse).collect(Collectors.toList());
    }

    @Override
    public DomesticStaffResponse getStaffById(Long id) {
        DomesticStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), staff.getSociety().getId());
        return toStaffResponse(staff);
    }

    @Override
    public DomesticStaffResponse updateStaff(Long id, DomesticStaffRequest request) {
        DomesticStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff not found"));

        staff.setName(request.getName());
        staff.setPhone(request.getPhone());
        staff.setStaffType(request.getStaffType());
        staff.setIdProofType(request.getIdProofType());
        staff.setIdProofNumber(request.getIdProofNumber());
        staff.setAddress(request.getAddress());

        return toStaffResponse(staffRepository.save(staff));
    }

    @Override
    public DomesticStaffResponse toggleStaffStatus(Long id) {
        DomesticStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff not found"));
        staff.setIsActive(!staff.getIsActive());
        return toStaffResponse(staffRepository.save(staff));
    }

    @Override
    public DomesticStaffResponse verifyStaff(Long id, Long userId) {
        DomesticStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff not found"));
        staff.setIsVerified(true);
        return toStaffResponse(staffRepository.save(staff));
    }

    @Override
    public void deleteStaff(Long id) {
        if (!staffRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Staff not found");
        }
        staffRepository.deleteById(id);
    }

    // --- Attendance Management ---

    @Override
    public StaffAttendanceResponse recordAttendance(Long userId, StaffAttendanceRequest request) {
        DomesticStaff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff not found"));

        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        } else {
            society = staff.getSociety();
        }

        StaffAttendance attendance = new StaffAttendance();
        attendance.setStaff(staff);
        attendance.setSociety(society);
        attendance.setAttendanceDate(request.getAttendanceDate() != null ? request.getAttendanceDate() : LocalDate.now());
        attendance.setCheckInTime(request.getCheckInTime() != null ? request.getCheckInTime() : LocalDateTime.now());
        attendance.setCheckOutTime(request.getCheckOutTime());
        attendance.setStatus(request.getStatus() != null ? request.getStatus() : "PRESENT");
        attendance.setNotes(request.getNotes());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            attendance.setFlat(flat);
        }

        return toAttendanceResponse(attendanceRepository.save(attendance));
    }

    @Override
    public List<StaffAttendanceResponse> getAttendanceBySociety(Long societyId, LocalDate date) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return attendanceRepository.findBySocietyIdAndAttendanceDate(societyId, date).stream()
                .map(this::toAttendanceResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffAttendanceResponse> getAttendanceByStaff(Long staffId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByStaffIdAndAttendanceDateBetween(staffId, startDate, endDate).stream()
                .map(this::toAttendanceResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffAttendanceResponse> getAttendanceByFlat(Long flatId) {
        return attendanceRepository.findByFlatId(flatId).stream()
                .map(this::toAttendanceResponse).collect(Collectors.toList());
    }

    @Override
    public StaffAttendanceResponse markCheckOut(Long attendanceId) {
        StaffAttendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attendance record not found"));
        attendance.setCheckOutTime(LocalDateTime.now());
        return toAttendanceResponse(attendanceRepository.save(attendance));
    }

    // --- Mappers ---

    private DomesticStaffResponse toStaffResponse(DomesticStaff staff) {
        DomesticStaffResponse response = new DomesticStaffResponse();
        response.setId(staff.getId());
        response.setName(staff.getName());
        response.setPhone(staff.getPhone());
        response.setStaffType(staff.getStaffType());
        response.setIdProofType(staff.getIdProofType());
        response.setIdProofNumber(staff.getIdProofNumber());
        response.setSocietyId(staff.getSociety().getId());
        response.setSocietyName(staff.getSociety().getName());
        response.setAddress(staff.getAddress());
        response.setRating(staff.getRating());
        response.setIsActive(staff.getIsActive());
        response.setIsVerified(staff.getIsVerified());
        response.setCreatedAt(staff.getCreatedAt());
        return response;
    }

    private StaffAttendanceResponse toAttendanceResponse(StaffAttendance attendance) {
        StaffAttendanceResponse response = new StaffAttendanceResponse();
        response.setId(attendance.getId());
        response.setStaffId(attendance.getStaff().getId());
        response.setStaffName(attendance.getStaff().getName());
        response.setStaffType(attendance.getStaff().getStaffType());
        if (attendance.getFlat() != null) {
            response.setFlatId(attendance.getFlat().getId());
            response.setFlatNumber(attendance.getFlat().getFlatNumber());
        }
        response.setSocietyId(attendance.getSociety().getId());
        response.setAttendanceDate(attendance.getAttendanceDate());
        response.setCheckInTime(attendance.getCheckInTime());
        response.setCheckOutTime(attendance.getCheckOutTime());
        response.setStatus(attendance.getStatus());
        response.setNotes(attendance.getNotes());
        response.setCreatedAt(attendance.getCreatedAt());
        return response;
    }
}
