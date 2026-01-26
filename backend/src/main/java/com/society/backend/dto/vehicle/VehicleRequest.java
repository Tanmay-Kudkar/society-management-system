package com.society.backend.dto.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VehicleRequest {
    @NotNull(message = "Flat ID is required")
    private Long flatId;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;

    private String brand;
    private String model;
    private String color;
}
