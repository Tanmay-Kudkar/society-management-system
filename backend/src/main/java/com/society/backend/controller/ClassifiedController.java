package com.society.backend.controller;

import com.society.backend.dto.ClassifiedRequest;
import com.society.backend.dto.ClassifiedResponse;
import com.society.backend.service.ClassifiedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/classifieds")
@RequiredArgsConstructor
public class ClassifiedController {

    private final ClassifiedService service;

    @PostMapping
    public ResponseEntity<ClassifiedResponse> create(@Valid @RequestBody ClassifiedRequest request,
                                                     @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassifiedResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody ClassifiedRequest request,
                                                     @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassifiedResponse> getById(@PathVariable Long id,
                                                      @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<ClassifiedResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String listingType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getBySociety(societyId, status, category, listingType,
                PageRequest.of(page, size, Sort.by("createdAt").descending()), userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestHeader("X-User-Id") Long userId) {
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/sold")
    public ResponseEntity<ClassifiedResponse> markSold(@PathVariable Long id,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.markSold(id, userId));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ClassifiedResponse> markClosed(@PathVariable Long id,
                                                         @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.markClosed(id, userId));
    }

    @PatchMapping("/{id}/flag")
    public ResponseEntity<ClassifiedResponse> flag(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body,
                                                   @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.flag(id, body.get("reason"), userId));
    }

    @PatchMapping("/{id}/unflag")
    public ResponseEntity<ClassifiedResponse> unflag(@PathVariable Long id,
                                                     @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.unflag(id, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getCounts(societyId, userId));
    }
}
