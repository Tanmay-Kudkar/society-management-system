package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.ClassifiedRequest;
import com.society.backend.notification.dto.response.ClassifiedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface ClassifiedService {

    ClassifiedResponse create(ClassifiedRequest request, Long userId);

    ClassifiedResponse update(Long id, ClassifiedRequest request, Long userId);

    ClassifiedResponse getById(Long id, Long userId);

    Page<ClassifiedResponse> getBySociety(Long societyId, String status, String category, String listingType, Pageable pageable, Long userId);

    void delete(Long id, Long userId);

    ClassifiedResponse markSold(Long id, Long userId);

    ClassifiedResponse markClosed(Long id, Long userId);

    ClassifiedResponse flag(Long id, String reason, Long userId);

    ClassifiedResponse unflag(Long id, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);
}
