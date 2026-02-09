package com.society.backend.dto.emergency;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkEmergencyContactImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private String message;
    private List<EmergencyContactImportResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class EmergencyContactImportResult {
        private int rowNumber;
        private String name;
        private String contactType;
        private boolean success;
        private String errorMessage;
        private Long contactId;

        public static EmergencyContactImportResult success(int rowNumber, String name, String contactType,
                Long contactId) {
            EmergencyContactImportResult r = new EmergencyContactImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setContactType(contactType);
            r.setSuccess(true);
            r.setContactId(contactId);
            return r;
        }

        public static EmergencyContactImportResult failure(int rowNumber, String name, String contactType,
                String error) {
            EmergencyContactImportResult r = new EmergencyContactImportResult();
            r.setRowNumber(rowNumber);
            r.setName(name);
            r.setContactType(contactType);
            r.setSuccess(false);
            r.setErrorMessage(error);
            return r;
        }
    }
}
