package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private Long societyId;
    private String societyName;
    private Long raisedById;
    private String raisedByName;
    private Long assignedToId;
    private String assignedToName;
    private String type;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String resolution;
    private String lastReplyBy;
    private String lastReplyAt;
    private Integer progressPercent;
    private Integer pendingDays;
    private Boolean isOverdue;
    private Integer overdueDays;
    private Integer escalationLevel;
    private String createdAt;
    private String updatedAt;
    private String resolvedAt;
    private String closeUndoPreviousStatus;
    private String closeUndoExpiresAt;
}
