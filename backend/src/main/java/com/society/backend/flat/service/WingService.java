package com.society.backend.flat.service;

import com.society.backend.flat.dto.request.WingRequest;
import com.society.backend.flat.dto.response.WingResponse;

import java.util.List;

public interface WingService {
    List<WingResponse> getAll();

    List<WingResponse> getBySociety(Long societyId);

    WingResponse getById(Long id);

    WingResponse create(WingRequest request);

    WingResponse update(Long id, WingRequest request);

    void delete(Long id, boolean force);
}
