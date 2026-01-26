package com.society.backend.dto.notice;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class NoticeResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String title;
    private String content;
    private String priority;
    private LocalDate expiryDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
