package com.society.backend.service.commonarea;

import com.society.backend.dto.request.CommonAreaScheduleRequest;
import com.society.backend.dto.response.CommonAreaScheduleResponse;

import java.util.List;
import java.util.Map;

public interface CommonAreaScheduleService {

    CommonAreaScheduleResponse create(Long userId, CommonAreaScheduleRequest request);

    CommonAreaScheduleResponse update(Long id, Long userId, CommonAreaScheduleRequest request);

    CommonAreaScheduleResponse getById(Long id, Long userId);

    List<CommonAreaScheduleResponse> getBySociety(Long societyId, Long userId);

    List<CommonAreaScheduleResponse> getByStatus(Long societyId, String status, Long userId);

    List<CommonAreaScheduleResponse> getByAreaType(Long societyId, String areaType, Long userId);

    List<CommonAreaScheduleResponse> getByMaintenanceType(Long societyId, String maintenanceType, Long userId);

    List<CommonAreaScheduleResponse> getOverdue(Long societyId, Long userId);

    CommonAreaScheduleResponse markCompleted(Long id, Long userId);

    CommonAreaScheduleResponse pause(Long id, Long userId);

    CommonAreaScheduleResponse resume(Long id, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);

    void delete(Long id, Long userId);
}
