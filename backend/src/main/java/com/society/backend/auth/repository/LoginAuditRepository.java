package com.society.backend.auth.repository;

import com.society.backend.auth.entity.LoginAudit;
import com.society.backend.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    List<LoginAudit> findByUserIdOrderByTimestampDesc(Long userId);

    List<LoginAudit> findByUserIdAndUserRoleOrderByTimestampDesc(Long userId, Role role);

    List<LoginAudit> findByUser_Society_IdOrderByTimestampDesc(Long societyId);

    List<LoginAudit> findByUser_Society_IdAndUserRoleOrderByTimestampDesc(Long societyId, Role role);

    // Most recent LOGIN audit for a user (for periodic location refresh)
    Optional<LoginAudit> findTopByUserIdAndActionOrderByTimestampDesc(
            Long userId, LoginAudit.Action action);

    Optional<LoginAudit> findTopByUserIdAndActionAndLatitudeIsNotNullAndLongitudeIsNotNullOrderByTimestampDesc(
            Long userId, LoginAudit.Action action);

    // For finding paired LOGIN after a LOGOUT's timestamp (closest next LOGIN by same user)
    Optional<LoginAudit> findTopByUserIdAndActionAndTimestampAfterOrderByTimestampAsc(
            Long userId, LoginAudit.Action action, LocalDateTime timestamp);

    // For finding paired LOGOUT after a LOGIN's timestamp (closest next LOGOUT by same user)
    Optional<LoginAudit> findTopByUserIdAndActionAndTimestampBeforeOrderByTimestampDesc(
            Long userId, LoginAudit.Action action, LocalDateTime timestamp);
}
