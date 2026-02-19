package com.society.backend.controller;

import com.society.backend.dto.request.MoveRecordRequest;
import com.society.backend.dto.response.MoveRecordResponse;
import com.society.backend.service.MoveRecordService;
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
@RequestMapping("/move-records")
@RequiredArgsConstructor
public class MoveRecordController {

    private final MoveRecordService moveRecordService;

    private Long getUserId(Authentication auth) {
        return Long.parseLong(auth.getName());
    }

    @PostMapping
    public ResponseEntity<MoveRecordResponse> create(@Valid @RequestBody MoveRecordRequest request, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.create(request, getUserId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MoveRecordResponse> update(@PathVariable Long id, @Valid @RequestBody MoveRecordRequest request, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.update(id, request, getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MoveRecordResponse> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getById(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<MoveRecordResponse>> getBySociety(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getBySociety(societyId, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/type/{moveType}")
    public ResponseEntity<List<MoveRecordResponse>> getByType(@PathVariable Long societyId, @PathVariable String moveType, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getByType(societyId, moveType, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<MoveRecordResponse>> getByStatus(@PathVariable Long societyId, @PathVariable String status, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getByStatus(societyId, status, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/date/{date}")
    public ResponseEntity<List<MoveRecordResponse>> getByDate(@PathVariable Long societyId,
                                                                @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                                Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getByDate(societyId, date, getUserId(auth)));
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<MoveRecordResponse>> getByUser(@PathVariable Long targetUserId, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getByUser(targetUserId, getUserId(auth)));
    }

    @PatchMapping("/{id}/in-progress")
    public ResponseEntity<MoveRecordResponse> markInProgress(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.markInProgress(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/completed")
    public ResponseEntity<MoveRecordResponse> markCompleted(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.markCompleted(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/cancelled")
    public ResponseEntity<MoveRecordResponse> markCancelled(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.markCancelled(id, getUserId(auth)));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, Authentication auth) {
        return ResponseEntity.ok(moveRecordService.getCounts(societyId, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        moveRecordService.delete(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
