package com.society.backend.exception;

import org.springframework.http.HttpStatus;

public class AccessDeniedException extends ApiException {
    public AccessDeniedException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }

    public AccessDeniedException() {
        super(HttpStatus.FORBIDDEN, "Access denied. You don't have permission to perform this action.");
    }
}
