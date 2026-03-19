package com.society.backend.user.service;

import com.society.backend.user.dto.request.EmployeeSalaryPaymentRequest;
import com.society.backend.user.dto.response.EmployeeSalaryPaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeSalaryPaymentService {

    EmployeeSalaryPaymentResponse recordPayment(Long employeeId, EmployeeSalaryPaymentRequest request, Long requesterId);

    Page<EmployeeSalaryPaymentResponse> getBySociety(
            Long societyId,
            LocalDate fromMonth,
            LocalDate toMonth,
            Pageable pageable,
            Long requesterId
    );

    List<EmployeeSalaryPaymentResponse> getByEmployee(Long employeeId, LocalDate fromMonth, LocalDate toMonth, Long requesterId);
}
