package com.society.backend.notification.repository;

import com.society.backend.notification.entity.NotificationPreference;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    @EntityGraph(attributePaths = { "user" })
    Optional<NotificationPreference> findByUserId(Long userId);

    @EntityGraph(attributePaths = { "user" })
    List<NotificationPreference> findAllByUserIdOrderByIdDesc(Long userId);
}
