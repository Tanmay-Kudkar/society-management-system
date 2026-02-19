package com.society.backend.service;

import com.society.backend.dto.request.MoveRecordRequest;
import com.society.backend.dto.response.MoveRecordResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface MoveRecordService {
    MoveRecordResponse create(MoveRecordRequest request, Long userId);
    MoveRecordResponse update(Long id, MoveRecordRequest request, Long userId);
    MoveRecordResponse getById(Long id, Long userId);
    List<MoveRecordResponse> getBySociety(Long societyId, Long userId);
    List<MoveRecordResponse> getByType(Long societyId, String moveType, Long userId);
    List<MoveRecordResponse> getByStatus(Long societyId, String status, Long userId);
    List<MoveRecordResponse> getByDate(Long societyId, LocalDate date, Long userId);
    List<MoveRecordResponse> getByUser(Long targetUserId, Long userId);
    MoveRecordResponse markInProgress(Long id, Long userId);
    MoveRecordResponse markCompleted(Long id, Long userId);
    MoveRecordResponse markCancelled(Long id, Long userId);
    Map<String, Long> getCounts(Long societyId, Long userId);
    void delete(Long id, Long userId);
}
