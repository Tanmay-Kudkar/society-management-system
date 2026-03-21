package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketReplyResponse {
    private Long id;
    private Long ticketId;
    private Long repliedById;
    private String repliedByName;
    private String message;
    private String createdAt;
}
