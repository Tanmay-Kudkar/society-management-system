package com.society.backend.notification.repository;

import com.society.backend.notification.entity.NoticeAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoticeAttendanceRepository extends JpaRepository<NoticeAttendance, Long> {
    Optional<NoticeAttendance> findByNoticeIdAndUserId(Long noticeId, Long userId);

    List<NoticeAttendance> findByNoticeIdOrderByMarkedAtDesc(Long noticeId);
}
