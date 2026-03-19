package com.society.backend.user.repository;

import com.society.backend.user.entity.EmployeeSalaryPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeSalaryPaymentRepository extends JpaRepository<EmployeeSalaryPayment, Long> {

    Page<EmployeeSalaryPayment> findBySocietyIdAndSalaryMonthBetween(
            Long societyId,
            LocalDate fromMonth,
            LocalDate toMonth,
            Pageable pageable
    );

    List<EmployeeSalaryPayment> findByEmployeeIdAndSalaryMonthBetweenOrderBySalaryMonthDesc(
            Long employeeId,
            LocalDate fromMonth,
            LocalDate toMonth
    );
}
