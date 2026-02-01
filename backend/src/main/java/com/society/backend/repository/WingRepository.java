package com.society.backend.repository;

import com.society.backend.entity.Wing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WingRepository extends JpaRepository<Wing, Long> {
    List<Wing> findBySocietyId(Long societyId);

    long countBySocietyId(Long societyId);
}
