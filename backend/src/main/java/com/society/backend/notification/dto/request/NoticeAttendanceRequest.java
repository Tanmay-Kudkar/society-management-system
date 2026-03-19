package com.society.backend.notification.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoticeAttendanceRequest {
    private String status; // PRESENT, ABSENT
}
