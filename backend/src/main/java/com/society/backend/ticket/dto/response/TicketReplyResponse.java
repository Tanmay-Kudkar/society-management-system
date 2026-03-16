package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TicketReplyResponse {
    private Long id;
    private Long ticketId;
    private Long repliedById;
    private String repliedByName;
    private String message;
    private LocalDateTime createdAt;
}
