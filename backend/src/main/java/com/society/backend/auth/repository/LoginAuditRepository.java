package com.society.backend.auth.repository;

import com.society.backend.auth.entity.LoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    List<LoginAudit> findByUserIdOrderByTimestampDesc(Long userId);

    List<LoginAudit> findByUser_Society_IdOrderByTimestampDesc(Long societyId);
}
