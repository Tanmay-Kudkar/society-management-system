package com.society.backend.auth.repository;

import com.society.backend.auth.entity.LoginAudit;
import com.society.backend.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    List<LoginAudit> findByUserIdOrderByTimestampDesc(Long userId);

    List<LoginAudit> findByUserIdAndUserRoleOrderByTimestampDesc(Long userId, Role role);

    List<LoginAudit> findByUser_Society_IdOrderByTimestampDesc(Long societyId);

    List<LoginAudit> findByUser_Society_IdAndUserRoleOrderByTimestampDesc(Long societyId, Role role);

    Optional<LoginAudit> findTopByUserIdAndActionAndLatitudeIsNotNullAndLongitudeIsNotNullOrderByTimestampDesc(
            Long userId,
            LoginAudit.Action action);
}
