package com.society.backend.society.service;

import com.society.backend.society.dto.request.SocietySettingRequest;
import com.society.backend.society.dto.response.SocietySettingResponse;

public interface SocietySettingService {
    SocietySettingResponse getBySocietyId(Long societyId);

    SocietySettingResponse upsertBySocietyId(Long societyId, SocietySettingRequest request);
}