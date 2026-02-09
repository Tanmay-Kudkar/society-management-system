package com.society.backend.repository.organization;

import com.society.backend.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    Optional<Organization> findByOwnerEmail(String ownerEmail);

    List<Organization> findByIsActiveTrue();

    List<Organization> findBySubscriptionType(String subscriptionType);

    List<Organization> findBySubscriptionStatus(String subscriptionStatus);

    long countByIsActiveTrue();
}
