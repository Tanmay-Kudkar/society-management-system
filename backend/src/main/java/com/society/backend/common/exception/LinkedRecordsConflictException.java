package com.society.backend.common.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

public class LinkedRecordsConflictException extends ApiException {

    private final List<Impact> impacts;

    public LinkedRecordsConflictException(String message, List<Impact> impacts) {
        super(HttpStatus.CONFLICT, message);
        this.impacts = impacts;
    }

    public List<Impact> getImpacts() {
        return impacts;
    }

    public static class Impact {
        private final String label;
        private final long count;

        public Impact(String label, long count) {
            this.label = label;
            this.count = count;
        }

        public String getLabel() {
            return label;
        }

        public long getCount() {
            return count;
        }
    }
}
