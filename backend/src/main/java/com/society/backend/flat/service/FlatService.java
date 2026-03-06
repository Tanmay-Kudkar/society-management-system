package com.society.backend.flat.service;

import com.society.backend.flat.dto.FlatRequest;
import com.society.backend.flat.dto.FlatResponse;

import java.util.List;

public interface FlatService {
    FlatResponse create(FlatRequest request);

    List<FlatResponse> getAll(Long userId);

    List<FlatResponse> getBySociety(Long societyId);

    FlatResponse getById(Long id);

    FlatResponse update(Long id, FlatRequest request);

    void delete(Long id, boolean force);
}
