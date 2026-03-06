package com.society.backend.society.controller;

import com.society.backend.society.dto.SocietyRuleRequest;
import com.society.backend.society.dto.SocietyRuleResponse;
import com.society.backend.society.service.SocietyRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/society-rules")
@RequiredArgsConstructor
public class SocietyRuleController {

    private final SocietyRuleService service;

    @PostMapping
    public ResponseEntity<SocietyRuleResponse> create(@Valid @RequestBody SocietyRuleRequest request,
                                                      @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SocietyRuleResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody SocietyRuleRequest request,
                                                      @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocietyRuleResponse> getById(@PathVariable Long id,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getById(id, userId));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<Page<SocietyRuleResponse>> getBySociety(
            @PathVariable Long societyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getBySociety(societyId, status, category,
                PageRequest.of(page, size, Sort.by("sortOrder").ascending().and(Sort.by("createdAt").descending())), userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestHeader("X-User-Id") Long userId) {
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<SocietyRuleResponse> publish(@PathVariable Long id,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.publish(id, userId));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<SocietyRuleResponse> archive(@PathVariable Long id,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.archive(id, userId));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<SocietyRuleResponse> approve(@PathVariable Long id,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.approve(id, userId));
    }

    @GetMapping("/society/{societyId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long societyId,
                                                       @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getCounts(societyId, userId));
    }
}
