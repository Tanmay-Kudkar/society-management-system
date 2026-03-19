package com.society.backend.user.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.service.RoleService;
import com.society.backend.user.dto.request.EmployeeSalaryPaymentRequest;
import com.society.backend.user.dto.response.EmployeeSalaryPaymentResponse;
import com.society.backend.user.entity.Employee;
import com.society.backend.user.entity.EmployeeSalaryPayment;
import com.society.backend.user.entity.User;
import com.society.backend.user.repository.EmployeeRepository;
import com.society.backend.user.repository.EmployeeSalaryPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeSalaryPaymentServiceImpl implements EmployeeSalaryPaymentService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryPaymentRepository employeeSalaryPaymentRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public EmployeeSalaryPaymentResponse recordPayment(Long employeeId, EmployeeSalaryPaymentRequest request, Long requesterId) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        BigDecimal deduction = request.getDeductionAmount() != null ? request.getDeductionAmount() : BigDecimal.ZERO;
        if (deduction.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deduction cannot be negative");
        }

        if (request.getBaseSalary().compareTo(deduction) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deduction cannot exceed base salary");
        }

        EmployeeSalaryPayment payment = new EmployeeSalaryPayment();
        payment.setEmployee(employee);
        payment.setSociety(employee.getSociety());
        payment.setSalaryMonth(request.getSalaryMonth().withDayOfMonth(1));
        payment.setBaseSalary(request.getBaseSalary());
        payment.setDeductionAmount(deduction);
        payment.setNetPaid(request.getBaseSalary().subtract(deduction));
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMode(request.getPaymentMode());
        payment.setReferenceNumber(request.getReferenceNumber());
        payment.setDeductionReason(request.getDeductionReason());
        payment.setNotes(request.getNotes());
        payment.setRecordedBy(requester);
        payment.setPaidAt(LocalDateTime.now());

        EmployeeSalaryPayment saved = employeeSalaryPaymentRepository.save(payment);
        log.info("User {} recorded salary payment {} for employee {}", requesterId, saved.getId(), employeeId);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeSalaryPaymentResponse> getBySociety(
            Long societyId,
            LocalDate fromMonth,
            LocalDate toMonth,
            Pageable pageable,
            Long requesterId
    ) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);
        roleService.enforceSocietyScope(requester, societyId);

        LocalDate safeFrom = (fromMonth != null ? fromMonth : LocalDate.now().minusMonths(5)).withDayOfMonth(1);
        LocalDate safeTo = (toMonth != null ? toMonth : LocalDate.now()).withDayOfMonth(1);

        if (safeFrom.isAfter(safeTo)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "fromMonth must be before or equal to toMonth");
        }

        return employeeSalaryPaymentRepository
                .findBySocietyIdAndSalaryMonthBetween(societyId, safeFrom, safeTo, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeSalaryPaymentResponse> getByEmployee(Long employeeId, LocalDate fromMonth, LocalDate toMonth, Long requesterId) {
        roleService.requireEmployeeRecordAccess(requesterId);
        User requester = roleService.getUser(requesterId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee record not found"));
        roleService.enforceSocietyScope(requester, employee.getSociety().getId());

        LocalDate safeFrom = (fromMonth != null ? fromMonth : LocalDate.now().minusMonths(5)).withDayOfMonth(1);
        LocalDate safeTo = (toMonth != null ? toMonth : LocalDate.now()).withDayOfMonth(1);

        if (safeFrom.isAfter(safeTo)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "fromMonth must be before or equal to toMonth");
        }

        return employeeSalaryPaymentRepository
                .findByEmployeeIdAndSalaryMonthBetweenOrderBySalaryMonthDesc(employeeId, safeFrom, safeTo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private EmployeeSalaryPaymentResponse toResponse(EmployeeSalaryPayment payment) {
        return EmployeeSalaryPaymentResponse.builder()
                .id(payment.getId())
                .employeeId(payment.getEmployee().getId())
                .employeeCode(payment.getEmployee().getEmployeeCode())
                .employeeUserId(payment.getEmployee().getUser().getId())
                .employeeName(payment.getEmployee().getUser().getName())
                .societyId(payment.getSociety().getId())
                .salaryMonth(payment.getSalaryMonth())
                .baseSalary(payment.getBaseSalary())
                .deductionAmount(payment.getDeductionAmount())
                .netPaid(payment.getNetPaid())
                .paymentDate(payment.getPaymentDate())
                .paymentMode(payment.getPaymentMode())
                .referenceNumber(payment.getReferenceNumber())
                .deductionReason(payment.getDeductionReason())
                .notes(payment.getNotes())
                .recordedById(payment.getRecordedBy() != null ? payment.getRecordedBy().getId() : null)
                .recordedByName(payment.getRecordedBy() != null ? payment.getRecordedBy().getName() : null)
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
