package com.society.backend.notification.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NoticeAttendanceResponse {
    private Long id;
    private Long noticeId;
    private Long userId;
    private String userName;
    private String userRole;
    private String userEmail;
    private String userPhone;
    private String unitNumber;
    private String wingName;
    private String status;
    private LocalDateTime markedAt;
}
