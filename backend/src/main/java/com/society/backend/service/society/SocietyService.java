package com.society.backend.service.society;

import com.society.backend.dto.society.SocietyRequest;
import com.society.backend.dto.society.SocietyResponse;

import java.util.List;

public interface SocietyService {
    SocietyResponse create(SocietyRequest request);

    List<SocietyResponse> getAll();

    SocietyResponse getById(Long id);

    SocietyResponse update(Long id, SocietyRequest request);

    void delete(Long id);
}
