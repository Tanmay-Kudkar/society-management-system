package com.society.backend.ticket.repository;

import com.society.backend.ticket.entity.TicketReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketReplyRepository extends JpaRepository<TicketReply, Long> {
    List<TicketReply> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    long countByTicketId(Long ticketId);

    void deleteByTicketId(Long ticketId);

    List<TicketReply> findByTicketIdAndRepliedByIdAndCreatedAtAfterOrderByCreatedAtDesc(
            Long ticketId,
            Long repliedById,
            LocalDateTime createdAt
    );
}
