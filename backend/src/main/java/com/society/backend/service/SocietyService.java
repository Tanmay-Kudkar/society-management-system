package com.society.backend.service;

import com.society.backend.dto.SocietyRequest;
import com.society.backend.dto.SocietyResponse;

import java.util.List;

public interface SocietyService {
    SocietyResponse create(SocietyRequest request);

    List<SocietyResponse> getAll();

    SocietyResponse getById(Long id);

    SocietyResponse update(Long id, SocietyRequest request);

    void delete(Long id);
}
