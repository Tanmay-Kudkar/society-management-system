package com.society.backend.repository.ticket;

import com.society.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findBySocietyId(Long societyId);

    List<Ticket> findByRaisedById(Long userId);

    List<Ticket> findByAssignedToId(Long userId);

    List<Ticket> findByStatus(String status);

    List<Ticket> findByType(String type);

    List<Ticket> findBySocietyIdAndStatus(Long societyId, String status);
}
