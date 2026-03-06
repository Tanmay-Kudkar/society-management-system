package com.society.backend.flat.repository;

import com.society.backend.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findByFlatId(Long flatId);

    List<Tenant> findByIsActiveTrue();
}
