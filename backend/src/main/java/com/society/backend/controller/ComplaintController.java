package com.society.backend.controller;

import com.society.backend.dto.ComplaintRequest;
import com.society.backend.dto.ComplaintResponse;
import com.society.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestParam Long userId,
            @Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.ok(complaintService.create(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAll() {
        return ResponseEntity.ok(complaintService.getAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ComplaintResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(complaintService.getByUser(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(complaintService.getByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(complaintService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        complaintService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
