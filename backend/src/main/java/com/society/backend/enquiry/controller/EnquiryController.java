package com.society.backend.enquiry.controller;

import com.society.backend.enquiry.dto.request.EnquiryRequest;
import com.society.backend.enquiry.dto.response.EnquiryResponse;
import com.society.backend.enquiry.service.EnquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enquiries")
@RequiredArgsConstructor
public class EnquiryController {

    private final EnquiryService enquiryService;

    /**
     * Public endpoint – called from the landing page "Enroll your society" form.
     * No authentication required.
     */
    @PostMapping
    public ResponseEntity<EnquiryResponse> submit(@Valid @RequestBody EnquiryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enquiryService.submit(request));
    }

    /**
     * Admin-only endpoint to view all enquiries from the platform dashboard.
     */
    @GetMapping
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    public ResponseEntity<List<EnquiryResponse>> getAll() {
        return ResponseEntity.ok(enquiryService.getAll());
    }
}
