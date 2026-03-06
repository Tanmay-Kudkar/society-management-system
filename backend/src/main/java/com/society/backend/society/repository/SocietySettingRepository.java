package com.society.backend.society.repository;

import com.society.backend.entity.SocietySetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocietySettingRepository extends JpaRepository<SocietySetting, Long> {
    Optional<SocietySetting> findBySocietyId(Long societyId);
}