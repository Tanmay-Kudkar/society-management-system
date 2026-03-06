package com.society.backend.notice.repository;

import com.society.backend.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByOrderByCreatedAtDesc();

    List<Notice> findBySocietyIdOrderByCreatedAtDesc(Long societyId);
}
