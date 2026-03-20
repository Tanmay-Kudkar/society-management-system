package com.society.backend.ticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintHistoryResponse {
    private Long id;
    private Long complaintId;
    private String actionType;
    private String actorName;
    private String fromStatus;
    private String toStatus;
    private String note;
    private LocalDateTime createdAt;
}
