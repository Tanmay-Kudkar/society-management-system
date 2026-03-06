package com.society.backend.security.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkVehicleImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<VehicleImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class VehicleImportResult {
        private int rowNumber;
        private String vehicleNumber;
        private String flatNumber;
        private boolean success;
        private String errorMessage;
        private Long vehicleId;

        public static VehicleImportResult success(int rowNumber, String vehicleNumber, String flatNumber,
                Long vehicleId) {
            VehicleImportResult r = new VehicleImportResult();
            r.setRowNumber(rowNumber);
            r.setVehicleNumber(vehicleNumber);
            r.setFlatNumber(flatNumber);
            r.setSuccess(true);
            r.setVehicleId(vehicleId);
            return r;
        }

        public static VehicleImportResult failure(int rowNumber, String vehicleNumber, String flatNumber,
                String error) {
            VehicleImportResult r = new VehicleImportResult();
            r.setRowNumber(rowNumber);
            r.setVehicleNumber(vehicleNumber);
            r.setFlatNumber(flatNumber);
            r.setSuccess(false);
            r.setErrorMessage(error);
            return r;
        }
    }
}
