package com.society.backend.flat.service;

import com.society.backend.dto.request.FacilityBookingRequest;
import com.society.backend.dto.response.FacilityBookingResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface FacilityBookingService {

    FacilityBookingResponse create(FacilityBookingRequest request, Long userId);

    FacilityBookingResponse update(Long id, FacilityBookingRequest request, Long userId);

    FacilityBookingResponse getById(Long id, Long userId);

    List<FacilityBookingResponse> getBySociety(Long societyId, Long userId);

    List<FacilityBookingResponse> getByStatus(Long societyId, String status, Long userId);

    List<FacilityBookingResponse> getByDate(Long societyId, LocalDate date, Long userId);

    List<FacilityBookingResponse> getByFacilityType(Long societyId, String facilityType, Long userId);

    List<FacilityBookingResponse> getByUser(Long bookedById, Long userId);

    List<FacilityBookingResponse> getByDateRange(Long societyId, LocalDate startDate, LocalDate endDate, Long userId);

    FacilityBookingResponse approve(Long id, String adminNotes, Long userId);

    FacilityBookingResponse reject(Long id, String adminNotes, Long userId);

    FacilityBookingResponse cancel(Long id, String reason, Long userId);

    Map<String, Long> getCounts(Long societyId, Long userId);

    void delete(Long id, Long userId);
}
