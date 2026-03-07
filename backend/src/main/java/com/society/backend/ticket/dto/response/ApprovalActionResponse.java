package com.society.backend.ticket.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ApprovalActionResponse {
    private Long id;
    private Integer stepOrder;
    private String action;
    private Long actedBy;
    private String actedByName;
    private String comments;
    private LocalDateTime createdAt;
}
