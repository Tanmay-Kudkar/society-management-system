package com.society.backend.service;

import com.society.backend.dto.NoticeRequest;
import com.society.backend.dto.NoticeResponse;

import java.util.List;

public interface NoticeService {
    NoticeResponse create(NoticeRequest request);

    List<NoticeResponse> getAll();

    NoticeResponse getById(Long id);

    NoticeResponse update(Long id, NoticeRequest request);

    void delete(Long id);
}
