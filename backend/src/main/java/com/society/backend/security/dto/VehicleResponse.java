package com.society.backend.security.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class VehicleResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private Long societyId;
    private String vehicleType;
    private String vehicleNumber;
    private String brand;
    private String model;
    private String color;
    private String ownerName;
    private String parkingSlot;
    private LocalDateTime createdAt;
}
