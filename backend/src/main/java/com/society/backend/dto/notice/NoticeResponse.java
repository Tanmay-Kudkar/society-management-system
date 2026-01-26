package com.society.backend.dto.notice;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class NoticeResponse {
    private Long id;
    private String title;
    private String message;
    private LocalDateTime createdAt;
}
