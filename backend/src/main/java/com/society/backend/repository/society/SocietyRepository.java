package com.society.backend.repository.society;

import com.society.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocietyRepository extends JpaRepository<Society, Long> {

    List<Society> findByOrganizationId(Long organizationId);

    @Query("SELECT s FROM Society s LEFT JOIN FETCH s.organization WHERE s.organization.id = :organizationId")
    List<Society> findByOrganizationIdWithOrg(@Param("organizationId") Long organizationId);

    long countByOrganizationId(Long organizationId);
}
