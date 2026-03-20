package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.request.NoticeAttendanceRequest;
import com.society.backend.notification.dto.response.NoticeAttendanceResponse;
import com.society.backend.notification.dto.response.NoticeResponse;

import java.util.List;

public interface NoticeService {
    NoticeResponse create(NoticeRequest request);

    List<NoticeResponse> getAll();

    NoticeResponse getById(Long id);

    NoticeResponse update(Long id, NoticeRequest request);

    NoticeResponse undo(Long id);

    void delete(Long id, boolean force);

    List<NoticeResponse> getBySocietyId(Long societyId);

    NoticeAttendanceResponse markAttendance(Long noticeId, Long userId, NoticeAttendanceRequest request);

    NoticeAttendanceResponse getMyAttendance(Long noticeId, Long userId);

    List<NoticeAttendanceResponse> getAttendanceByNotice(Long noticeId, Long userId);
}
