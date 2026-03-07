package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.response.NoticeResponse;
import com.society.backend.notification.entity.Notice;
import com.society.backend.society.entity.Society;
import com.society.backend.common.exception.ApiException;
import com.society.backend.notification.repository.NoticeRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public NoticeServiceImpl(NoticeRepository noticeRepository, SocietyRepository societyRepository,
            RoleService roleService) {
        this.noticeRepository = noticeRepository;
        this.societyRepository = societyRepository;
        this.roleService = roleService;
    }

    @Override
    public NoticeResponse create(NoticeRequest request) {
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        roleService.enforceSocietyScope(roleService.getCurrentUser(), society.getId());

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
        var currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return noticeRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> {
                    if (currentUser.getRole() == com.society.backend.user.entity.Role.MASTER_ADMIN) {
                        return true;
                    }
                    return n.getSociety() != null && currentUser.getSociety() != null
                            && n.getSociety().getId().equals(currentUser.getSociety().getId());
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public NoticeResponse getById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));
        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), notice.getSociety().getId());
        }
        return toResponse(notice);
    }

    @Override
    public NoticeResponse update(Long id, NoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));

        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), notice.getSociety().getId());
        }

        if (request.getSocietyId() != null) {
            Society society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(roleService.getCurrentUser(), society.getId());
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
        var notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));
        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(roleService.getCurrentUser(), notice.getSociety().getId());
        }
        if (!noticeRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Notice not found");
        }
        noticeRepository.deleteById(id);
    }

    @Override
    public List<NoticeResponse> getBySocietyId(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
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
