package com.society.backend.flat.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.society.backend.flat.entity.Wing;
@Getter
@Setter
@Builder
public class MoveRecordResponse {

    private Long id;
    private Long societyId;
    private Long userId;
    private String userName;
    private String flatNumber;
    private String wing;
    private String moveType;
    private LocalDate moveDate;
    private String scheduledTime;
    private String actualTime;
    private String vehicleNumber;
    private String vehicleType;
    private String moversCompany;
    private String moversPhone;
    private Integer numberOfHelpers;
    private String itemsDescription;
    private Boolean elevatorRequired;
    private BigDecimal depositAmount;
    private String depositStatus;
    private String status;
    private String adminNotes;
    private Boolean inspectionDone;
    private String damageReported;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
