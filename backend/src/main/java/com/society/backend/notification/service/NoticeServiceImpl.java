package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.NoticeRequest;
import com.society.backend.notification.dto.request.NoticeAttendanceRequest;
import com.society.backend.notification.dto.response.NoticeAttendanceResponse;
import com.society.backend.notification.dto.response.NoticeResponse;
import com.society.backend.notification.entity.NoticeAttendance;
import com.society.backend.notification.entity.Notice;
import com.society.backend.society.entity.Society;
import com.society.backend.common.exception.ApiException;
import com.society.backend.notification.repository.NoticeAttendanceRepository;
import com.society.backend.notification.repository.NoticeRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoticeServiceImpl implements NoticeService {

    private static final Set<String> ALLOWED_NOTICE_TYPES = Set.of("GENERAL", "CIRCULAR", "MEETING");
    private static final Set<String> ALLOWED_ATTENDANCE_STATUS = Set.of("PRESENT", "ABSENT");

    private final NoticeRepository noticeRepository;
    private final NoticeAttendanceRepository noticeAttendanceRepository;
    private final SocietyRepository societyRepository;
    private final RoleService roleService;

    public NoticeServiceImpl(NoticeRepository noticeRepository, NoticeAttendanceRepository noticeAttendanceRepository,
            SocietyRepository societyRepository,
            RoleService roleService) {
        this.noticeRepository = noticeRepository;
        this.noticeAttendanceRepository = noticeAttendanceRepository;
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
        notice.setNoticeType(normalizeNoticeType(request.getNoticeType()));
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
        if (request.getNoticeType() != null) {
            notice.setNoticeType(normalizeNoticeType(request.getNoticeType()));
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

    @Override
    @Transactional
    public NoticeAttendanceResponse markAttendance(Long noticeId, Long userId, NoticeAttendanceRequest request) {
        roleService.canRecordMeetingAttendance(userId);

        User actor = roleService.getUser(userId);
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));

        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(actor, notice.getSociety().getId());
        }

        if (!"MEETING".equalsIgnoreCase(normalizeNoticeType(notice.getNoticeType()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Attendance can be recorded only for MEETING notices.");
        }

        NoticeAttendance attendance = noticeAttendanceRepository.findByNoticeIdAndUserId(noticeId, userId)
                .orElseGet(NoticeAttendance::new);
        attendance.setNotice(notice);
        attendance.setUser(actor);
        attendance.setStatus(normalizeAttendanceStatus(request != null ? request.getStatus() : null));
        attendance.setMarkedAt(java.time.LocalDateTime.now());

        return toAttendanceResponse(noticeAttendanceRepository.save(attendance));
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeAttendanceResponse getMyAttendance(Long noticeId, Long userId) {
        roleService.canRecordMeetingAttendance(userId);

        User actor = roleService.getUser(userId);
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));

        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(actor, notice.getSociety().getId());
        }

        NoticeAttendance attendance = noticeAttendanceRepository.findByNoticeIdAndUserId(noticeId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attendance not found"));

        return toAttendanceResponse(attendance);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeAttendanceResponse> getAttendanceByNotice(Long noticeId, Long userId) {
        roleService.canViewMeetingAttendance(userId);

        User actor = roleService.getUser(userId);
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notice not found"));

        if (notice.getSociety() != null) {
            roleService.enforceSocietyScope(actor, notice.getSociety().getId());
        }

        return noticeAttendanceRepository.findByNoticeIdOrderByMarkedAtDesc(noticeId).stream()
                .map(this::toAttendanceResponse)
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
        response.setNoticeType(normalizeNoticeType(notice.getNoticeType()));
        response.setExpiryDate(notice.getExpiryDate());
        response.setIsActive(notice.getIsActive());
        response.setCreatedAt(notice.getCreatedAt());
        return response;
    }

    private String normalizeNoticeType(String noticeType) {
        if (noticeType == null || noticeType.isBlank()) {
            return "GENERAL";
        }
        String normalized = noticeType.trim().toUpperCase();
        if (!ALLOWED_NOTICE_TYPES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid noticeType. Allowed values: GENERAL, CIRCULAR, MEETING");
        }
        return normalized;
    }

    private String normalizeAttendanceStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PRESENT";
        }
        String normalized = status.trim().toUpperCase();
        if (!ALLOWED_ATTENDANCE_STATUS.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid attendance status. Allowed values: PRESENT, ABSENT");
        }
        return normalized;
    }

    private NoticeAttendanceResponse toAttendanceResponse(NoticeAttendance attendance) {
        NoticeAttendanceResponse response = new NoticeAttendanceResponse();
        response.setId(attendance.getId());
        response.setNoticeId(attendance.getNotice() != null ? attendance.getNotice().getId() : null);
        response.setUserId(attendance.getUser() != null ? attendance.getUser().getId() : null);
        response.setUserName(attendance.getUser() != null ? attendance.getUser().getName() : null);
        response.setStatus(attendance.getStatus());
        response.setMarkedAt(attendance.getMarkedAt());
        return response;
    }
}
