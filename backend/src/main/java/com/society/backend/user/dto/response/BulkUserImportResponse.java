package com.society.backend.user.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkUserImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<UserImportResult> results = new ArrayList<>();
    private String message;
    
    @Getter
    @Setter
    public static class UserImportResult {
        private int rowNumber;
        private String name;
        private String email;
        private String flatNumber;
        private boolean success;
        private String errorMessage;
        private Long userId; // If created successfully
    }
}
