package com.society.backend.user.repository;

import com.society.backend.user.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<Employee> findBySocietyIdAndIsActiveTrue(Long societyId);

    Page<Employee> findBySocietyId(Long societyId, Pageable pageable);

    Page<Employee> findBySocietyIdAndDepartment(Long societyId, String department, Pageable pageable);

    Page<Employee> findBySocietyIdAndIsActive(Long societyId, Boolean isActive, Pageable pageable);

    long countBySocietyId(Long societyId);

    long countBySocietyIdAndIsActive(Long societyId, Boolean isActive);

    long countBySocietyIdAndDepartment(Long societyId, String department);
}
