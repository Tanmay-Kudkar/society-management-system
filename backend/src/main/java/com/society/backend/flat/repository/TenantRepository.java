package com.society.backend.flat.repository;

import com.society.backend.flat.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findByFlatId(Long flatId);

    List<Tenant> findBySocietyId(Long societyId);

    List<Tenant> findByIsActiveTrue();

    Optional<Tenant> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
