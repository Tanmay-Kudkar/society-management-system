package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TicketResponse {
    private Long id;
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
    private Integer progressPercent;
    private Integer pendingDays;
    private Boolean isOverdue;
    private Integer overdueDays;
    private Integer escalationLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
