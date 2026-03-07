package com.society.backend.society.service;

import com.society.backend.society.dto.request.SocietyRequest;
import com.society.backend.society.dto.response.SocietyResponse;

import java.util.List;

public interface SocietyService {
    SocietyResponse create(SocietyRequest request);

    List<SocietyResponse> getAll();

    SocietyResponse getById(Long id);

    SocietyResponse update(Long id, SocietyRequest request);

    void delete(Long id, boolean force);
}
