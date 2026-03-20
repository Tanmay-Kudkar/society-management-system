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
public class ComplaintCommentResponse {
    private Long id;
    private Long complaintId;
    private Long userId;
    private String userName;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
