package com.society.backend.controller;

import com.society.backend.dto.TicketRequest;
import com.society.backend.dto.TicketResponse;
import com.society.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> create(
            @Valid @RequestBody TicketRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<TicketResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(ticketService.getBySocietyId(societyId));
    }

    @GetMapping("/raised-by/{userId}")
    public ResponseEntity<List<TicketResponse>> getByRaisedBy(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.getByRaisedBy(userId));
    }

    @GetMapping("/assigned-to/{userId}")
    public ResponseEntity<List<TicketResponse>> getByAssignedTo(@PathVariable Long userId) {
        return ResponseEntity.ok(ticketService.getByAssignedTo(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TicketResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ticketService.getByStatus(status));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAll() {
        return ResponseEntity.ok(ticketService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TicketRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.update(id, request, userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String resolution,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status, resolution, userId));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assign(
            @PathVariable Long id,
            @RequestParam Long assignedToId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.assign(id, assignedToId, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        ticketService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
