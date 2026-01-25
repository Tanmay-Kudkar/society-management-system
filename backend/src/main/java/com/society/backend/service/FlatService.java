package com.society.backend.service;

import com.society.backend.dto.FlatRequest;
import com.society.backend.dto.FlatResponse;

import java.util.List;

public interface FlatService {
    FlatResponse create(FlatRequest request);

    List<FlatResponse> getAll();

    List<FlatResponse> getBySociety(Long societyId);

    FlatResponse getById(Long id);

    FlatResponse update(Long id, FlatRequest request);

    void delete(Long id);
}
