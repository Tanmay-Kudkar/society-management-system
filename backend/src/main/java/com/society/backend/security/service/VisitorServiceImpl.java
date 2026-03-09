package com.society.backend.security.service;

import com.society.backend.security.dto.request.VisitorRequest;
import com.society.backend.security.dto.response.VisitorResponse;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.security.entity.Visitor;
import com.society.backend.common.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.security.repository.VisitorRepository;
import com.society.backend.common.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class VisitorServiceImpl implements VisitorService {

    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    public VisitorServiceImpl(VisitorRepository visitorRepository, UserRepository userRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository, RoleService roleService) {
        this.visitorRepository = visitorRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.roleService = roleService;
    }

    @Override
    public VisitorResponse create(Long userId, VisitorRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
        } else if (user.getSociety() != null) {
            society = user.getSociety();
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
        }

        Visitor visitor = new Visitor();
        visitor.setVisitorName(request.getVisitorName());
        visitor.setVisitorPhone(request.getVisitorPhone());
        visitor.setVisitorType(request.getVisitorType());
        visitor.setPurpose(request.getPurpose());
        visitor.setSociety(society);
        visitor.setVehicleNumber(request.getVehicleNumber());
        visitor.setExpectedArrival(request.getExpectedArrival());
        visitor.setNotes(request.getNotes());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            visitor.setFlat(flat);
        }

        if (request.getIsPreApproved() != null && request.getIsPreApproved()) {
            visitor.setIsPreApproved(true);
            visitor.setApprovedBy(user);
            visitor.setStatus("EXPECTED");
        }

        Visitor saved = visitorRepository.save(visitor);
        return toResponse(saved);
    }

    @Override
    public List<VisitorResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return visitorRepository.findAll().stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }

        if (user.getSociety() != null) {
            return visitorRepository.findBySocietyIdOrderByCreatedAtDesc(user.getSociety().getId()).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public List<VisitorResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return visitorRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getTodayArrivals(Long societyId, Long userId) {
        User user = roleService.getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1).minusNanos(1);

        return visitorRepository.findBySocietyIdAndExpectedArrivalBetweenOrderByExpectedArrivalAsc(societyId, start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getOverstayed(Long societyId, Long userId, Integer thresholdHours) {
        User user = roleService.getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        int effectiveHours = thresholdHours != null && thresholdHours > 0 ? thresholdHours : 4;
        LocalDateTime cutoff = LocalDateTime.now().minusHours(effectiveHours);

        return visitorRepository.findBySocietyIdAndStatusAndCheckInTimeBeforeOrderByCheckInTimeAsc(
                        societyId,
                        "CHECKED_IN",
                        cutoff
                ).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getBySocietyAndDateRange(Long societyId, Long userId, LocalDate fromDate, LocalDate toDate) {
        User user = roleService.getUser(userId);
        roleService.enforceSocietyScope(user, societyId);

        if (fromDate == null || toDate == null || fromDate.isAfter(toDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid date range");
        }

        LocalDateTime start = fromDate.atStartOfDay();
        LocalDateTime end = toDate.plusDays(1).atStartOfDay().minusNanos(1);

        return visitorRepository.findBySocietyIdAndExpectedArrivalBetweenOrderByExpectedArrivalAsc(societyId, start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByFlat(Long flatId) {
        return visitorRepository.findByFlatId(flatId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByStatus(String status) {
        return visitorRepository.findByStatus(status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByType(String visitorType) {
        return visitorRepository.findByVisitorType(visitorType).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public VisitorResponse getById(Long id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), visitor.getSociety().getId());
        return toResponse(visitor);
    }

    @Override
    public VisitorResponse checkIn(Long id, Long userId) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));

        roleService.enforceSocietyScope(user, visitor.getSociety().getId());
        if (!"EXPECTED".equals(visitor.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Visitor can only be checked in from EXPECTED status");
        }

        if (requiresOtp(visitor.getVisitorType())) {
            if (visitor.getOtpCode() == null || visitor.getOtpVerifiedAt() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "OTP verification is required before check-in for DELIVERY and CAB visitors");
            }
            if (visitor.getOtpExpiresAt() != null && visitor.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired. Generate and verify a new OTP");
            }
        }

        visitor.setCheckInTime(LocalDateTime.now());
        visitor.setStatus("CHECKED_IN");
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse checkOut(Long id, Long userId) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));

        roleService.enforceSocietyScope(user, visitor.getSociety().getId());
        if (!"CHECKED_IN".equals(visitor.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Visitor can only be checked out from CHECKED_IN status");
        }

        visitor.setCheckOutTime(LocalDateTime.now());
        visitor.setStatus("CHECKED_OUT");
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse generateOtp(Long id, Long userId) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));

        roleService.enforceSocietyScope(user, visitor.getSociety().getId());
        if (!requiresOtp(visitor.getVisitorType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "OTP is only supported for DELIVERY and CAB visitor types");
        }
        if (!"EXPECTED".equals(visitor.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "OTP can only be generated while visitor status is EXPECTED");
        }

        LocalDateTime now = LocalDateTime.now();
        if (visitor.getOtpLastGeneratedAt() != null && visitor.getOtpLastGeneratedAt().plusSeconds(30).isAfter(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait before generating another OTP");
        }

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        visitor.setOtpCode(otp);
        visitor.setOtpExpiresAt(now.plusMinutes(15));
        visitor.setOtpVerifiedAt(null);
        visitor.setOtpAttempts(0);
        visitor.setOtpLastGeneratedAt(now);

        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse verifyOtp(Long id, Long userId, String otpCode) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));

        roleService.enforceSocietyScope(user, visitor.getSociety().getId());
        if (!requiresOtp(visitor.getVisitorType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "OTP verification is only supported for DELIVERY and CAB visitor types");
        }
        if (!"EXPECTED".equals(visitor.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "OTP can only be verified while visitor status is EXPECTED");
        }
        if (visitor.getOtpCode() == null || visitor.getOtpExpiresAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No OTP found. Please generate OTP first");
        }
        if (visitor.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired. Please generate OTP again");
        }

        String normalized = otpCode == null ? "" : otpCode.trim();
        if (!visitor.getOtpCode().equals(normalized)) {
            int attempts = visitor.getOtpAttempts() == null ? 0 : visitor.getOtpAttempts();
            visitor.setOtpAttempts(attempts + 1);
            visitorRepository.save(visitor);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        visitor.setOtpVerifiedAt(LocalDateTime.now());
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse updateStatus(Long id, String status, Long userId) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));

        roleService.enforceSocietyScope(user, visitor.getSociety().getId());

        String normalizedStatus = status == null ? "" : status.toUpperCase();
        if (!List.of("EXPECTED", "CHECKED_IN", "CHECKED_OUT", "REJECTED", "CANCELLED").contains(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid visitor status: " + status);
        }

        if ("CHECKED_OUT".equals(normalizedStatus) && visitor.getCheckInTime() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot check out visitor without check-in");
        }

        if ("CHECKED_IN".equals(normalizedStatus) && "CHECKED_OUT".equals(visitor.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot move visitor from CHECKED_OUT back to CHECKED_IN");
        }

        visitor.setStatus(normalizedStatus);
        if ("CHECKED_IN".equals(normalizedStatus) && visitor.getCheckInTime() == null) {
            visitor.setCheckInTime(LocalDateTime.now());
        }
        if ("CHECKED_OUT".equals(normalizedStatus) && visitor.getCheckOutTime() == null) {
            visitor.setCheckOutTime(LocalDateTime.now());
        }
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public void delete(Long id, Long userId) {
        User user = roleService.getUser(userId);
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        roleService.enforceSocietyScope(user, visitor.getSociety().getId());
        visitorRepository.delete(visitor);
    }

    private VisitorResponse toResponse(Visitor visitor) {
        VisitorResponse response = new VisitorResponse();
        response.setId(visitor.getId());
        response.setVisitorName(visitor.getVisitorName());
        response.setVisitorPhone(visitor.getVisitorPhone());
        response.setVisitorType(visitor.getVisitorType());
        response.setPurpose(visitor.getPurpose());
        if (visitor.getFlat() != null) {
            response.setFlatId(visitor.getFlat().getId());
            response.setFlatNumber(visitor.getFlat().getFlatNumber());
        }
        response.setSocietyId(visitor.getSociety().getId());
        response.setSocietyName(visitor.getSociety().getName());
        response.setVehicleNumber(visitor.getVehicleNumber());
        response.setExpectedArrival(visitor.getExpectedArrival());
        response.setCheckInTime(visitor.getCheckInTime());
        response.setCheckOutTime(visitor.getCheckOutTime());
        response.setStatus(visitor.getStatus());
        response.setIsPreApproved(visitor.getIsPreApproved());
        response.setApprovalCode(visitor.getApprovalCode());
        // OTP code intentionally excluded from response to prevent leaking secrets
        response.setOtpExpiresAt(visitor.getOtpExpiresAt());
        response.setOtpVerifiedAt(visitor.getOtpVerifiedAt());
        response.setOtpAttempts(visitor.getOtpAttempts());
        if (visitor.getApprovedBy() != null) {
            response.setApprovedByName(visitor.getApprovedBy().getName());
        }
        response.setNotes(visitor.getNotes());
        response.setCreatedAt(visitor.getCreatedAt());
        return response;
    }

    private boolean requiresOtp(String visitorType) {
        if (visitorType == null) {
            return false;
        }
        return "DELIVERY".equalsIgnoreCase(visitorType) || "CAB".equalsIgnoreCase(visitorType);
    }
}
