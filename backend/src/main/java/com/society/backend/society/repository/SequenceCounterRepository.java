package com.society.backend.repository.society;

import com.society.backend.entity.SequenceCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SequenceCounterRepository extends JpaRepository<SequenceCounter, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SequenceCounter s WHERE s.societyId = :societyId " +
           "AND s.counterType = :counterType AND s.financialYear = :financialYear")
    Optional<SequenceCounter> findForUpdate(Long societyId, String counterType, Integer financialYear);

    Optional<SequenceCounter> findBySocietyIdAndCounterTypeAndFinancialYear(
            Long societyId, String counterType, Integer financialYear);
}
