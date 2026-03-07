package com.society.backend.flat.controller;

import com.society.backend.flat.dto.request.MoveRecordRequest;
import com.society.backend.flat.dto.response.MoveRecordResponse;
import com.society.backend.flat.service.MoveRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/move-records")
@RequiredArgsConstructor
public class MoveRecordController {

    private final MoveRecordService moveRecordService;

    @PostMapping
    public ResponseEntity<MoveRecordResponse> create(@Valid @RequestBody MoveRecordRequest request, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MoveRecordResponse> update(@PathVariable Long id, @Valid @RequestBody MoveRecordRequest request, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MoveRecordResponse> getById(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<MoveRecordResponse>> getBySociety(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getBySociety(societyId, userId));
    }

    @GetMapping("/society/{societyId}/type/{moveType}")
    public ResponseEntity<List<MoveRecordResponse>> getByType(@PathVariable Long societyId, @PathVariable String moveType, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getByType(societyId, moveType, userId));
    }

    @GetMapping("/society/{societyId}/status/{status}")
    public ResponseEntity<List<MoveRecordResponse>> getByStatus(@PathVariable Long societyId, @PathVariable String status, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getByStatus(societyId, status, userId));
    }

    @GetMapping("/society/{societyId}/date/{date}")
    public ResponseEntity<List<MoveRecordResponse>> getByDate(@PathVariable Long societyId,
                                                                @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                                @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getByDate(societyId, date, userId));
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<MoveRecordResponse>> getByUser(@PathVariable Long targetUserId, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getByUser(targetUserId, userId));
    }

    @PatchMapping("/{id}/in-progress")
    public ResponseEntity<MoveRecordResponse> markInProgress(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.markInProgress(id, userId));
    }

    @PatchMapping("/{id}/completed")
    public ResponseEntity<MoveRecordResponse> markCompleted(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.markCompleted(id, userId));
    }

    @PatchMapping("/{id}/cancelled")
    public ResponseEntity<MoveRecordResponse> markCancelled(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.markCancelled(id, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId, @RequestParam Long userId) {
        return ResponseEntity.ok(moveRecordService.getCounts(societyId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        moveRecordService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
