package com.society.backend.flat.controller;

import com.society.backend.flat.dto.request.FacilityBookingRequest;
import com.society.backend.flat.dto.response.FacilityBookingResponse;
import com.society.backend.flat.service.FacilityBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/facility-bookings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FacilityBookingController {

    private final FacilityBookingService facilityBookingService;

    @PostMapping
    public ResponseEntity<FacilityBookingResponse> create(@Valid @RequestBody FacilityBookingRequest request,
                                                           @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityBookingResponse> update(@PathVariable Long id,
                                                           @Valid @RequestBody FacilityBookingRequest request,
                                                           @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityBookingResponse> getById(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<FacilityBookingResponse>> getBySociety(@PathVariable Long societyId,
                                                                       @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<FacilityBookingResponse>> getByStatus(@PathVariable Long societyId,
                                                                      @PathVariable String status,
                                                                      @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getByStatus(societyId, status, userId));
    }

    @GetMapping("/society/{societyId}/date/{date}")
    public ResponseEntity<List<FacilityBookingResponse>> getByDate(@PathVariable Long societyId,
                                                                    @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                                    @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getByDate(societyId, date, userId));
    }

    @GetMapping("/society/{societyId}/type/{facilityType}")
    public ResponseEntity<List<FacilityBookingResponse>> getByFacilityType(@PathVariable Long societyId,
                                                                            @PathVariable String facilityType,
                                                                            @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getByFacilityType(societyId, facilityType, userId));
    }

    @GetMapping("/user/{bookedById}")
    public ResponseEntity<List<FacilityBookingResponse>> getByUser(@PathVariable Long bookedById,
                                                                     @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getByUser(bookedById, userId));
    }

    @GetMapping("/society/{societyId}/range")
    public ResponseEntity<List<FacilityBookingResponse>> getByDateRange(
            @PathVariable Long societyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getByDateRange(societyId, startDate, endDate, userId));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<FacilityBookingResponse> approve(@PathVariable Long id,
                                                            @RequestBody(required = false) Map<String, String> body,
                                                            @RequestParam Long userId) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(facilityBookingService.approve(id, notes, userId));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<FacilityBookingResponse> reject(@PathVariable Long id,
                                                           @RequestBody(required = false) Map<String, String> body,
                                                           @RequestParam Long userId) {
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(facilityBookingService.reject(id, notes, userId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<FacilityBookingResponse> cancel(@PathVariable Long id,
                                                           @RequestBody(required = false) Map<String, String> body,
                                                           @RequestParam Long userId) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(facilityBookingService.cancel(id, reason, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(facilityBookingService.getCounts(societyId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        facilityBookingService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
