package com.society.backend.dto.user;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BulkCreateUsersResponse {
    private int totalUnits;
    private int usersCreated;
    private int usersSkipped;
    private int errors;
    private String message;
    private List<BulkCreateResult> results = new ArrayList<>();

    @Getter
    @Setter
    public static class BulkCreateResult {
        private Long flatId;
        private String flatNumber;
        private String status; // CREATED, SKIPPED, ERROR
        private String email;
        private Long userId;
        private String errorMessage;
        
        public static BulkCreateResult created(Long flatId, String flatNumber, String email, Long userId) {
            BulkCreateResult result = new BulkCreateResult();
            result.setFlatId(flatId);
            result.setFlatNumber(flatNumber);
            result.setStatus("CREATED");
            result.setEmail(email);
            result.setUserId(userId);
            return result;
        }
        
        public static BulkCreateResult skipped(Long flatId, String flatNumber, String reason) {
            BulkCreateResult result = new BulkCreateResult();
            result.setFlatId(flatId);
            result.setFlatNumber(flatNumber);
            result.setStatus("SKIPPED");
            result.setErrorMessage(reason);
            return result;
        }
        
        public static BulkCreateResult error(Long flatId, String flatNumber, String errorMessage) {
            BulkCreateResult result = new BulkCreateResult();
            result.setFlatId(flatId);
            result.setFlatNumber(flatNumber);
            result.setStatus("ERROR");
            result.setErrorMessage(errorMessage);
            return result;
        }
    }
}
