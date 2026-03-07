package com.society.backend.vendor.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkVendorImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<VendorImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class VendorImportResult {
        private int rowNumber;
        private String name;
        private String serviceType;
        private boolean success;
        private String errorMessage;
        private Long vendorId;

        public static VendorImportResult success(int rowNumber, String name, String serviceType, Long vendorId) {
            VendorImportResult r = new VendorImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setServiceType(serviceType);
            r.setSuccess(true);
            r.setVendorId(vendorId);
            return r;
        }

        public static VendorImportResult failure(int rowNumber, String name, String serviceType, String error) {
            VendorImportResult r = new VendorImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setServiceType(serviceType);
            r.setSuccess(false);
            r.setErrorMessage(error);
            return r;
        }
    }
}
