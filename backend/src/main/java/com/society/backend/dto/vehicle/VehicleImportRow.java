package com.society.backend.dto.vehicle;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VehicleImportRow {
    private int rowNumber;
    private String flatNumber;
    private String vehicleType; // TWO_WHEELER, FOUR_WHEELER
    private String vehicleNumber;
    private String brand;
    private String model;
    private String color;
    private String ownerName;
    private String parkingSlot;

    private boolean valid = true;
    private String errorMessage;
}
