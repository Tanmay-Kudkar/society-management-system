package com.society.backend.service.notice;

import com.society.backend.dto.notice.NoticeRequest;
import com.society.backend.dto.notice.NoticeResponse;
import com.society.backend.entity.Notice;
import com.society.backend.entity.Society;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.notice.NoticeRepository;
import com.society.backend.repository.society.SocietyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final SocietyRepository societyRepository;

    public NoticeServiceImpl(NoticeRepository noticeRepository, SocietyRepository societyRepository) {
        this.noticeRepository = noticeRepository;
        this.societyRepository = societyRepository;
    }

    @Override
    public NoticeResponse create(NoticeRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Notice notice = new Notice();
        notice.setSociety(society);
        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        notice.setExpiryDate(request.getExpiryDate());
        notice.setIsActive(true);

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

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            notice.setSociety(society);
        }

        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        if (request.getPriority() != null) {
            notice.setPriority(request.getPriority());
        }
        notice.setExpiryDate(request.getExpiryDate());

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

    @Override
    public List<NoticeResponse> getBySocietyId(Long societyId) {
        return noticeRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private NoticeResponse toResponse(Notice notice) {
        NoticeResponse response = new NoticeResponse();
        response.setId(notice.getId());
        response.setSocietyId(notice.getSociety() != null ? notice.getSociety().getId() : null);
        response.setSocietyName(notice.getSociety() != null ? notice.getSociety().getName() : null);
        response.setTitle(notice.getTitle());
        response.setContent(notice.getContent());
        response.setPriority(notice.getPriority());
        response.setExpiryDate(notice.getExpiryDate());
        response.setIsActive(notice.getIsActive());
        response.setCreatedAt(notice.getCreatedAt());
        return response;
    }
}
