package com.society.backend.controller;

import com.society.backend.dto.FlatRequest;
import com.society.backend.dto.FlatResponse;
import com.society.backend.service.FlatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flats")
public class FlatController {

    private final FlatService flatService;

    public FlatController(FlatService flatService) {
        this.flatService = flatService;
    }

    @PostMapping
    public ResponseEntity<FlatResponse> create(@Valid @RequestBody FlatRequest request) {
        return ResponseEntity.ok(flatService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<FlatResponse>> getAll() {
        return ResponseEntity.ok(flatService.getAll());
    }

    @GetMapping("/society/{societyId}")
    public ResponseEntity<List<FlatResponse>> getBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(flatService.getBySociety(societyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlatResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(flatService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlatResponse> update(@PathVariable Long id, @Valid @RequestBody FlatRequest request) {
        return ResponseEntity.ok(flatService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flatService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
