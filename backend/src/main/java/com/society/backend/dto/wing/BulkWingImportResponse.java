package com.society.backend.dto.wing;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkWingImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<WingImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class WingImportResult {
        private int rowNumber;
        private String name;
        private boolean success;
        private String errorMessage;
        private Long wingId;

        public static WingImportResult success(int rowNumber, String name, Long wingId) {
            WingImportResult r = new WingImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setSuccess(true);
            r.setWingId(wingId);
            return r;
        }

        public static WingImportResult failure(int rowNumber, String name, String error) {
            WingImportResult r = new WingImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setSuccess(false);
            r.setErrorMessage(error);
            return r;
        }
    }
}
