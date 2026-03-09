package com.society.backend.ticket.controller;

import com.society.backend.ticket.dto.request.TicketRequest;
import com.society.backend.ticket.dto.response.TicketResponse;
import com.society.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT')")
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
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<TicketResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TicketRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.update(id, request, userId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String resolution,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status, resolution, userId));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')")
    public ResponseEntity<TicketResponse> assign(
            @PathVariable Long id,
            @RequestParam Long assignedToId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.assign(id, assignedToId, userId));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<TicketResponse> updateProgress(
            @PathVariable Long id,
            @RequestParam Integer progress,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ticketService.updateProgress(id, progress, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        ticketService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<TicketResponse>> getOverdue() {
        return ResponseEntity.ok(ticketService.getOverdue());
    }

    @GetMapping("/overdue/society/{societyId}")
    public ResponseEntity<List<TicketResponse>> getOverdueBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(ticketService.getOverdueBySociety(societyId));
    }

    @GetMapping("/overdue/count")
    public ResponseEntity<Long> getOverdueCount() {
        return ResponseEntity.ok(ticketService.getOverdueCount());
    }
}
