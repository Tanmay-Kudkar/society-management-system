package com.society.backend.service.impl;

import com.society.backend.dto.NoticeRequest;
import com.society.backend.dto.NoticeResponse;
import com.society.backend.entity.Notice;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.NoticeRepository;
import com.society.backend.service.NoticeService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeServiceImpl(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @Override
    public NoticeResponse create(NoticeRequest request) {
        Notice notice = new Notice();
        notice.setTitle(request.getTitle());
        notice.setMessage(request.getMessage());
        Notice saved = noticeRepository.save(notice);
        return toResponse(saved);
    }

    @Override
    public List<NoticeResponse> getAll() {
        return noticeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public NoticeResponse getById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));
        return toResponse(notice);
    }

    @Override
    public NoticeResponse update(Long id, NoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));
        notice.setTitle(request.getTitle());
        notice.setMessage(request.getMessage());
        Notice saved = noticeRepository.save(notice);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Notice not found");
        }
        noticeRepository.deleteById(id);
    }

    private NoticeResponse toResponse(Notice notice) {
        return new NoticeResponse(
                notice.getId(),
                notice.getTitle(),
                notice.getMessage(),
                notice.getCreatedAt());
    }
}
