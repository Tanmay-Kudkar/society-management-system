package com.society.backend.notice.service;

import com.society.backend.notice.dto.NoticeRequest;
import com.society.backend.notice.dto.NoticeResponse;

import java.util.List;

public interface NoticeService {
    NoticeResponse create(NoticeRequest request);

    List<NoticeResponse> getAll();

    NoticeResponse getById(Long id);

    NoticeResponse update(Long id, NoticeRequest request);

    void delete(Long id);

    List<NoticeResponse> getBySocietyId(Long societyId);
}
