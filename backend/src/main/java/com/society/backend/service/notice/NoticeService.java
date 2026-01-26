package com.society.backend.service.notice;

import com.society.backend.dto.notice.NoticeRequest;
import com.society.backend.dto.notice.NoticeResponse;

import java.util.List;

public interface NoticeService {
    NoticeResponse create(NoticeRequest request);

    List<NoticeResponse> getAll();

    NoticeResponse getById(Long id);

    NoticeResponse update(Long id, NoticeRequest request);

    void delete(Long id);
}
