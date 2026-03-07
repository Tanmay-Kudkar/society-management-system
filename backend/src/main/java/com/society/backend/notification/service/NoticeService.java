package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.response.NoticeResponse;

import java.util.List;

public interface NoticeService {
    NoticeResponse create(NoticeRequest request);

    List<NoticeResponse> getAll();

    NoticeResponse getById(Long id);

    NoticeResponse update(Long id, NoticeRequest request);

    void delete(Long id);

    List<NoticeResponse> getBySocietyId(Long societyId);
}
