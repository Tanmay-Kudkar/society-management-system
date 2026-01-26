package com.society.backend.dto.complaint;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ComplaintResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
}
