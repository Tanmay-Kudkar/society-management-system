package com.society.backend.controller;

import com.society.backend.dto.EmergencyContactRequest;
import com.society.backend.dto.EmergencyContactResponse;
import com.society.backend.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;

    @PostMapping
    public ResponseEntity<EmergencyContactResponse> create(
            @Valid @RequestBody EmergencyContactRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emergencyContactService.create(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmergencyContactResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(emergencyContactService.getById(id));
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<EmergencyContactResponse>> getBySocietyId(@PathVariable Long societyId) {
        return ResponseEntity.ok(emergencyContactService.getBySocietyId(societyId));
    }

    @GetMapping("/type/{contactType}")
    public ResponseEntity<List<EmergencyContactResponse>> getByContactType(@PathVariable String contactType) {
        return ResponseEntity.ok(emergencyContactService.getByContactType(contactType));
    }

    @GetMapping
    public ResponseEntity<List<EmergencyContactResponse>> getAll() {
        return ResponseEntity.ok(emergencyContactService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmergencyContactResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyContactRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(emergencyContactService.update(id, request, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<EmergencyContactResponse> deactivate(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(emergencyContactService.deactivate(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        emergencyContactService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
