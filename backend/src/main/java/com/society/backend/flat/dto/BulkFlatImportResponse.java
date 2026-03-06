package com.society.backend.flat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkFlatImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<FlatImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class FlatImportResult {
        private int rowNumber;
        private String flatNumber;
        private String unitType;
        private String wingCode;
        private boolean success;
        private String errorMessage;
        private Long flatId; // Set if successfully created

        public static FlatImportResult success(int rowNumber, String flatNumber, String unitType, Long flatId) {
            FlatImportResult result = new FlatImportResult();
            result.setRowNumber(rowNumber);
            result.setFlatNumber(flatNumber);
            result.setUnitType(unitType);
            result.setSuccess(true);
            result.setFlatId(flatId);
            return result;
        }

        public static FlatImportResult failure(int rowNumber, String flatNumber, String unitType, String error) {
            FlatImportResult result = new FlatImportResult();
            result.setRowNumber(rowNumber);
            result.setFlatNumber(flatNumber);
            result.setUnitType(unitType);
            result.setSuccess(false);
            result.setErrorMessage(error);
            return result;
        }
    }
}
