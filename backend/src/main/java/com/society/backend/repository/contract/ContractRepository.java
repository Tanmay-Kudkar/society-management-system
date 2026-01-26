package com.society.backend.repository.contract;

import com.society.backend.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findBySocietyId(Long societyId);

    List<Contract> findByContractType(String contractType);

    List<Contract> findByIsActiveTrue();

    @Query("SELECT c FROM Contract c WHERE c.endDate <= :date AND c.isActive = true")
    List<Contract> findExpiringSoon(LocalDate date);

    @Query("SELECT c FROM Contract c WHERE c.society.id = :societyId AND c.endDate <= :date AND c.isActive = true")
    List<Contract> findExpiringSoonBySociety(Long societyId, LocalDate date);
}
