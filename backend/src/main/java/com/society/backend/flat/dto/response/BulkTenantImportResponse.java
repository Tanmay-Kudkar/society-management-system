package com.society.backend.flat.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkTenantImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<TenantImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class TenantImportResult {
        private int rowNumber;
        private String name;
        private String flatNumber;
        private boolean success;
        private String errorMessage;
        private Long tenantId;

        public static TenantImportResult success(int rowNumber, String name, String flatNumber, Long tenantId) {
            TenantImportResult r = new TenantImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setFlatNumber(flatNumber);
            r.setSuccess(true);
            r.setTenantId(tenantId);
            return r;
        }

        public static TenantImportResult failure(int rowNumber, String name, String flatNumber, String error) {
            TenantImportResult r = new TenantImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setFlatNumber(flatNumber);
            r.setSuccess(false);
            r.setErrorMessage(error);
            return r;
        }
    }
}
