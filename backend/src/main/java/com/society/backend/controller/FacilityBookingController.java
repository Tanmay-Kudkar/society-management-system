package com.society.backend.controller;

import com.society.backend.dto.request.FacilityBookingRequest;
import com.society.backend.dto.response.FacilityBookingResponse;
import com.society.backend.service.FacilityBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/facility-bookings")
@RequiredArgsConstructor
public class FacilityBookingController {

    private final FacilityBookingService facilityBookingService;

    private Long getUserId(Authentication auth) {
        return Long.parseLong(auth.getName());
    }

    @PostMapping
    public ResponseEntity<FacilityBookingResponse> create(@Valid @RequestBody FacilityBookingRequest request,
                                                           Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.create(request, getUserId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityBookingResponse> update(@PathVariable Long id,
                                                           @Valid @RequestBody FacilityBookingRequest request,
                                                           Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.update(id, request, getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityBookingResponse> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getById(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<FacilityBookingResponse>> getBySociety(@PathVariable Long societyId,
                                                                       Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getBySociety(societyId, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<FacilityBookingResponse>> getByStatus(@PathVariable Long societyId,
                                                                      @PathVariable String status,
                                                                      Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getByStatus(societyId, status, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/date/{date}")
    public ResponseEntity<List<FacilityBookingResponse>> getByDate(@PathVariable Long societyId,
                                                                    @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                                    Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getByDate(societyId, date, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/type/{facilityType}")
    public ResponseEntity<List<FacilityBookingResponse>> getByFacilityType(@PathVariable Long societyId,
                                                                            @PathVariable String facilityType,
                                                                            Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getByFacilityType(societyId, facilityType, getUserId(auth)));
    }

    @GetMapping("/user/{bookedById}")
    public ResponseEntity<List<FacilityBookingResponse>> getByUser(@PathVariable Long bookedById,
                                                                     Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getByUser(bookedById, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/range")
    public ResponseEntity<List<FacilityBookingResponse>> getByDateRange(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getByDateRange(societyId, startDate, endDate, getUserId(auth)));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<FacilityBookingResponse> approve(@PathVariable Long id,
                                                            @RequestBody(required = false) Map<String, String> body,
                                                            Authentication auth) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(facilityBookingService.approve(id, notes, getUserId(auth)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<FacilityBookingResponse> reject(@PathVariable Long id,
                                                           @RequestBody(required = false) Map<String, String> body,
                                                           Authentication auth) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(facilityBookingService.reject(id, notes, getUserId(auth)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<FacilityBookingResponse> cancel(@PathVariable Long id,
                                                           @RequestBody(required = false) Map<String, String> body,
                                                           Authentication auth) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(facilityBookingService.cancel(id, reason, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(facilityBookingService.getCounts(societyId, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        facilityBookingService.delete(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
