package com.society.backend.dto.vehicle;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class VehicleResponse {
    private Long id;
    private Long flatId;
    private String flatNumber;
    private String vehicleType;
    private String vehicleNumber;
    private String brand;
    private String model;
    private String color;
    private LocalDateTime createdAt;
}
