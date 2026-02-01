package com.society.backend.service.flat;

import com.society.backend.dto.flat.FlatRequest;
import com.society.backend.dto.flat.FlatResponse;

import java.util.List;

public interface FlatService {
    FlatResponse create(FlatRequest request);

    List<FlatResponse> getAll(Long userId);

    List<FlatResponse> getBySociety(Long societyId);

    FlatResponse getById(Long id);

    FlatResponse update(Long id, FlatRequest request);

    void delete(Long id);
}
