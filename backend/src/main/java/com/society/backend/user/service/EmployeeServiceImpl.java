package com.society.backend.user.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.service.RoleService;
import com.society.backend.society.entity.Society;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.dto.request.EmployeeRequest;
import com.society.backend.user.dto.response.EmployeeResponse;
import com.society.backend.user.entity.Employee;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.EmployeeRepository;
import com.society.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeRequest request, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(requester, society.getId());

        User employeeUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (employeeUser.getRole() != Role.EMPLOYEE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User must have EMPLOYEE role to create an employee record");
        }

        if (employeeRepository.existsByUserId(employeeUser.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Employee record already exists for this user");
        }

        Employee employee = new Employee();
        employee.setUser(employeeUser);
        employee.setSociety(society);
        applyFields(employee, request);
        employee.setIsActive(true);

        Employee saved = employeeRepository.save(employee);
        log.info("User {} created employee record {} for user {}", requesterId, saved.getId(), employeeUser.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        applyFields(employee, request);

        Employee saved = employeeRepository.save(employee);
        log.info("User {} updated employee record {}", requesterId, id);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long id, Long requesterId) {
        roleService.requireMember(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        return toResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getByUserId(Long userId, Long requesterId) {
        roleService.requireMember(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found for this user"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        return toResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> getBySociety(Long societyId, String department, Boolean isActive, Pageable pageable, Long requesterId) {
        roleService.requireMember(requesterId);
        User requester = roleService.getUser(requesterId);
        roleService.enforceSocietyScope(requester, societyId);

        Page<Employee> page;
        if (department != null && !department.isEmpty()) {
            page = employeeRepository.findBySocietyIdAndDepartment(societyId, department, pageable);
        } else if (isActive != null) {
            page = employeeRepository.findBySocietyIdAndIsActive(societyId, isActive, pageable);
        } else {
            page = employeeRepository.findBySocietyId(societyId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional
    public void delete(Long id, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        employeeRepository.delete(employee);
        log.info("User {} deleted employee record {}", requesterId, id);
    }

    @Override
    @Transactional
    public EmployeeResponse deactivate(Long id, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        employee.setIsActive(false);
        Employee saved = employeeRepository.save(employee);
        log.info("User {} deactivated employee record {}", requesterId, id);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse recordAdvancePayment(Long id, BigDecimal amount, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Advance amount must be positive");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        employee.setAdvanceBalance(employee.getAdvanceBalance().add(amount));
        Employee saved = employeeRepository.save(employee);
        log.info("User {} recorded advance of {} for employee {}", requesterId, amount, id);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse deductAdvance(Long id, BigDecimal amount, Long requesterId) {
        roleService.requireAdminOrCommittee(requesterId);
        User requester = roleService.getUser(requesterId);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deduction amount must be positive");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        if (employee.getAdvanceBalance().compareTo(amount) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deduction exceeds current advance balance");
        }

        employee.setAdvanceBalance(employee.getAdvanceBalance().subtract(amount));
        Employee saved = employeeRepository.save(employee);
        log.info("User {} deducted advance of {} from employee {}", requesterId, amount, id);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getCounts(Long societyId, Long requesterId) {
        roleService.requireMember(requesterId);
        User requester = roleService.getUser(requesterId);
        roleService.enforceSocietyScope(requester, societyId);

        Map<String, Long> counts = new HashMap<>();
        counts.put("total", employeeRepository.countBySocietyId(societyId));
        counts.put("active", employeeRepository.countBySocietyIdAndIsActive(societyId, true));
        counts.put("inactive", employeeRepository.countBySocietyIdAndIsActive(societyId, false));
        counts.put("security", employeeRepository.countBySocietyIdAndDepartment(societyId, "SECURITY"));
        counts.put("housekeeping", employeeRepository.countBySocietyIdAndDepartment(societyId, "HOUSEKEEPING"));
        counts.put("maintenance", employeeRepository.countBySocietyIdAndDepartment(societyId, "MAINTENANCE"));
        return counts;
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private void applyFields(Employee employee, EmployeeRequest req) {
        if (req.getEmployeeCode() != null) employee.setEmployeeCode(req.getEmployeeCode());
        if (req.getDepartment() != null) employee.setDepartment(req.getDepartment());
        if (req.getDesignation() != null) employee.setDesignation(req.getDesignation());
        if (req.getJoiningDate() != null) employee.setJoiningDate(req.getJoiningDate());
        if (req.getTerminationDate() != null) employee.setTerminationDate(req.getTerminationDate());
        if (req.getEmploymentType() != null) employee.setEmploymentType(req.getEmploymentType());
        if (req.getShiftTiming() != null) employee.setShiftTiming(req.getShiftTiming());

        if (req.getMonthlySalary() != null) employee.setMonthlySalary(req.getMonthlySalary());
        if (req.getSalaryAccountNumber() != null) employee.setSalaryAccountNumber(req.getSalaryAccountNumber());
        if (req.getSalaryIfsc() != null) employee.setSalaryIfsc(req.getSalaryIfsc());
        if (req.getSalaryBankName() != null) employee.setSalaryBankName(req.getSalaryBankName());

        if (req.getIdProofType() != null) employee.setIdProofType(req.getIdProofType());
        if (req.getIdProofNumber() != null) employee.setIdProofNumber(req.getIdProofNumber());
        if (req.getIdProofDocumentUrl() != null) employee.setIdProofDocumentUrl(req.getIdProofDocumentUrl());
        if (req.getPhotoUrl() != null) employee.setPhotoUrl(req.getPhotoUrl());

        if (req.getEmergencyContactName() != null) employee.setEmergencyContactName(req.getEmergencyContactName());
        if (req.getEmergencyContactPhone() != null) employee.setEmergencyContactPhone(req.getEmergencyContactPhone());
        if (req.getAddress() != null) employee.setAddress(req.getAddress());

        if (req.getAdvanceBalance() != null) employee.setAdvanceBalance(req.getAdvanceBalance());
        if (req.getNotes() != null) employee.setNotes(req.getNotes());
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .userName(e.getUser().getName())
                .userEmail(e.getUser().getEmail())
                .userPhone(e.getUser().getPhone())
                .societyId(e.getSociety().getId())
                .societyName(e.getSociety().getName())
                .employeeCode(e.getEmployeeCode())
                .department(e.getDepartment())
                .designation(e.getDesignation())
                .joiningDate(e.getJoiningDate())
                .terminationDate(e.getTerminationDate())
                .employmentType(e.getEmploymentType())
                .shiftTiming(e.getShiftTiming())
                .monthlySalary(e.getMonthlySalary())
                .salaryAccountNumber(e.getSalaryAccountNumber())
                .salaryIfsc(e.getSalaryIfsc())
                .salaryBankName(e.getSalaryBankName())
                .idProofType(e.getIdProofType())
                .idProofNumber(e.getIdProofNumber())
                .idProofDocumentUrl(e.getIdProofDocumentUrl())
                .photoUrl(e.getPhotoUrl())
                .emergencyContactName(e.getEmergencyContactName())
                .emergencyContactPhone(e.getEmergencyContactPhone())
                .address(e.getAddress())
                .advanceBalance(e.getAdvanceBalance())
                .isActive(e.getIsActive())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
