package com.society.backend.society.controller;

import com.society.backend.society.dto.request.SocietySettingRequest;
import com.society.backend.society.dto.response.SocietySettingResponse;
import com.society.backend.common.service.RoleService;
import com.society.backend.society.service.SocietySettingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.society.backend.society.entity.Society;
@RestController
@RequestMapping("/society-settings")
@PreAuthorize("isAuthenticated()")
public class SocietySettingController {

    private final SocietySettingService societySettingService;
    private final RoleService roleService;

    public SocietySettingController(SocietySettingService societySettingService, RoleService roleService) {
        this.societySettingService = societySettingService;
        this.roleService = roleService;
    }

    @GetMapping("/{societyId}")
    public ResponseEntity<SocietySettingResponse> getBySocietyId(
            @PathVariable Long societyId,
            @RequestParam Long userId) {
        roleService.canManageFinancials(userId);
        return ResponseEntity.ok(societySettingService.getBySocietyId(societyId));
    }

    @PutMapping("/{societyId}")
    public ResponseEntity<SocietySettingResponse> upsertBySocietyId(
            @PathVariable Long societyId,
            @RequestParam Long userId,
            @Valid @RequestBody SocietySettingRequest request) {
        roleService.canManageFinancials(userId);
        return ResponseEntity.ok(societySettingService.upsertBySocietyId(societyId, request));
    }
}