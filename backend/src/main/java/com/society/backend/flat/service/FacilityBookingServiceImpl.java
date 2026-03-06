package com.society.backend.flat.service;

import com.society.backend.dto.request.FacilityBookingRequest;
import com.society.backend.dto.response.FacilityBookingResponse;
import com.society.backend.entity.FacilityBooking;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.flat.repository.FacilityBookingRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.flat.service.FacilityBookingService;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacilityBookingServiceImpl implements FacilityBookingService {

    private final FacilityBookingRepository facilityBookingRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private FacilityBookingResponse toResponse(FacilityBooking fb) {
        return FacilityBookingResponse.builder()
                .id(fb.getId())
                .societyId(fb.getSociety().getId())
                .bookedById(fb.getBookedBy().getId())
                .bookedByName(fb.getBookedBy().getName())
                .facilityName(fb.getFacilityName())
                .facilityType(fb.getFacilityType())
                .bookingDate(fb.getBookingDate())
                .startTime(fb.getStartTime())
                .endTime(fb.getEndTime())
                .purpose(fb.getPurpose())
                .attendees(fb.getAttendees())
                .status(fb.getStatus())
                .amount(fb.getAmount())
                .paymentStatus(fb.getPaymentStatus())
                .adminNotes(fb.getAdminNotes())
                .cancelledReason(fb.getCancelledReason())
                .createdAt(fb.getCreatedAt())
                .updatedAt(fb.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public FacilityBookingResponse create(FacilityBookingRequest request, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), request.getSocietyId());

        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new RuntimeException("Society not found"));
        User bookedBy = userRepository.findById(request.getBookedById())
                .orElseThrow(() -> new RuntimeException("Booked-by user not found"));

        FacilityBooking fb = new FacilityBooking();
        fb.setSociety(society);
        fb.setBookedBy(bookedBy);
        fb.setFacilityName(request.getFacilityName());
        fb.setFacilityType(request.getFacilityType());
        fb.setBookingDate(request.getBookingDate());
        fb.setStartTime(request.getStartTime());
        fb.setEndTime(request.getEndTime());
        fb.setPurpose(request.getPurpose());
        if (request.getAttendees() != null) fb.setAttendees(request.getAttendees());
        if (request.getAmount() != null) fb.setAmount(request.getAmount());
        if (request.getPaymentStatus() != null) fb.setPaymentStatus(request.getPaymentStatus());

        return toResponse(facilityBookingRepository.save(fb));
    }

    @Override
    @Transactional
    public FacilityBookingResponse update(Long id, FacilityBookingRequest request, Long userId) {
        roleService.requireMember(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());

        fb.setFacilityName(request.getFacilityName());
        fb.setFacilityType(request.getFacilityType());
        fb.setBookingDate(request.getBookingDate());
        fb.setStartTime(request.getStartTime());
        fb.setEndTime(request.getEndTime());
        fb.setPurpose(request.getPurpose());
        if (request.getAttendees() != null) fb.setAttendees(request.getAttendees());
        if (request.getAmount() != null) fb.setAmount(request.getAmount());
        if (request.getPaymentStatus() != null) fb.setPaymentStatus(request.getPaymentStatus());
        if (request.getAdminNotes() != null) fb.setAdminNotes(request.getAdminNotes());

        return toResponse(facilityBookingRepository.save(fb));
    }

    @Override
    public FacilityBookingResponse getById(Long id, Long userId) {
        roleService.requireMember(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());
        return toResponse(fb);
    }

    @Override
    public List<FacilityBookingResponse> getBySociety(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return facilityBookingRepository.findBySocietyIdOrderByBookingDateDesc(societyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FacilityBookingResponse> getByStatus(Long societyId, String status, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return facilityBookingRepository.findBySocietyIdAndStatusOrderByBookingDateDesc(societyId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FacilityBookingResponse> getByDate(Long societyId, LocalDate date, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return facilityBookingRepository.findBySocietyIdAndBookingDateOrderByStartTime(societyId, date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FacilityBookingResponse> getByFacilityType(Long societyId, String facilityType, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return facilityBookingRepository.findBySocietyIdAndFacilityTypeOrderByBookingDateDesc(societyId, facilityType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FacilityBookingResponse> getByUser(Long bookedById, Long userId) {
        roleService.requireMember(userId);
        return facilityBookingRepository.findByBookedByIdOrderByBookingDateDesc(bookedById)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FacilityBookingResponse> getByDateRange(Long societyId, LocalDate startDate, LocalDate endDate, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        return facilityBookingRepository.findBySocietyIdAndDateRange(societyId, startDate, endDate)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacilityBookingResponse approve(Long id, String adminNotes, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());

        fb.setStatus("APPROVED");
        if (adminNotes != null) fb.setAdminNotes(adminNotes);
        return toResponse(facilityBookingRepository.save(fb));
    }

    @Override
    @Transactional
    public FacilityBookingResponse reject(Long id, String adminNotes, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());

        fb.setStatus("REJECTED");
        if (adminNotes != null) fb.setAdminNotes(adminNotes);
        return toResponse(facilityBookingRepository.save(fb));
    }

    @Override
    @Transactional
    public FacilityBookingResponse cancel(Long id, String reason, Long userId) {
        roleService.requireMember(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());

        fb.setStatus("CANCELLED");
        if (reason != null) fb.setCancelledReason(reason);
        return toResponse(facilityBookingRepository.save(fb));
    }

    @Override
    public Map<String, Long> getCounts(Long societyId, Long userId) {
        roleService.requireMember(userId);
        roleService.enforceSocietyScope(getUser(userId), societyId);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("pending", facilityBookingRepository.countBySocietyIdAndStatus(societyId, "PENDING"));
        counts.put("approved", facilityBookingRepository.countBySocietyIdAndStatus(societyId, "APPROVED"));
        counts.put("rejected", facilityBookingRepository.countBySocietyIdAndStatus(societyId, "REJECTED"));
        counts.put("cancelled", facilityBookingRepository.countBySocietyIdAndStatus(societyId, "CANCELLED"));
        return counts;
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        roleService.requireAdminOrCommittee(userId);
        FacilityBooking fb = facilityBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility booking not found"));
        roleService.enforceSocietyScope(getUser(userId), fb.getSociety().getId());
        facilityBookingRepository.delete(fb);
    }
}
