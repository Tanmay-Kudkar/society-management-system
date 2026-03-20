package com.society.backend.ticket.repository;

import com.society.backend.ticket.entity.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, Long> {
    List<ComplaintComment> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
