package com.society.backend.society.service;

import com.society.backend.society.dto.SocietyRuleRequest;
import com.society.backend.society.dto.SocietyRuleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface SocietyRuleService {

    SocietyRuleResponse create(SocietyRuleRequest request, Long userId);

    SocietyRuleResponse update(Long id, SocietyRuleRequest request, Long userId);

    SocietyRuleResponse getById(Long id, Long userId);

    Page<SocietyRuleResponse> getBySociety(Long societyId, String status, String category, Pageable pageable, Long userId);

    void delete(Long id, Long userId);

    SocietyRuleResponse publish(Long id, Long userId);

    SocietyRuleResponse archive(Long id, Long userId);

    SocietyRuleResponse approve(Long id, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);
}
