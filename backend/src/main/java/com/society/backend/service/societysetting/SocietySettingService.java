package com.society.backend.service.societysetting;

import com.society.backend.dto.societysetting.SocietySettingRequest;
import com.society.backend.dto.societysetting.SocietySettingResponse;

public interface SocietySettingService {
    SocietySettingResponse getBySocietyId(Long societyId);

    SocietySettingResponse upsertBySocietyId(Long societyId, SocietySettingRequest request);
}