package com.society.backend.repository.society;

import com.society.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocietyRepository extends JpaRepository<Society, Long> {

    List<Society> findByOrganizationId(Long organizationId);

    long countByOrganizationId(Long organizationId);
}
