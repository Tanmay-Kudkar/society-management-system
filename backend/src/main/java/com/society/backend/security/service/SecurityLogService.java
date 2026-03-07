package com.society.backend.security.service;

import com.society.backend.security.entity.SecurityLog;
import com.society.backend.security.repository.SecurityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityLogService {
    private final SecurityLogRepository repository;

    public List<SecurityLog> getRecentLogs(Long societyId, int limit) {
        return repository.findBySocietyIdOrderByCreatedAtDesc(societyId, PageRequest.of(0, limit));
    }

    public SecurityLog createLog(SecurityLog log) {
        return repository.save(log);
    }
}
