package com.society.backend.flat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.society.backend.flat.entity.Wing;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Getter
@Setter
public class MoveRecordRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String flatNumber;
    private String wing;

    @NotBlank(message = "Move type is required")
    private String moveType;

    @NotNull(message = "Move date is required")
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
    private String adminNotes;
    private Boolean inspectionDone;
    private String damageReported;
}
