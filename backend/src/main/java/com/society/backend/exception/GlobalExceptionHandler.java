package com.society.backend.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.society.backend.dto.common.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidation(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {
                
                // Collect all validation errors
                Map<String, String> fieldErrors = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .collect(Collectors.toMap(
                                        FieldError::getField,
                                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                                        (existing, replacement) -> existing
                                ));
                
                // Get the first error as the main message
                String mainMessage = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .findFirst()
                                .map(FieldError::getDefaultMessage)
                                .orElse("Validation failed");

                Map<String, Object> response = new HashMap<>();
                response.put("timestamp", LocalDateTime.now().toString());
                response.put("status", 400);
                response.put("error", "Validation Error");
                response.put("message", mainMessage);
                response.put("fieldErrors", fieldErrors);
                response.put("path", request.getRequestURI());

                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
                        DataIntegrityViolationException ex,
                        HttpServletRequest request) {
                
                String message = "Data integrity error";
                String cause = ex.getMostSpecificCause().getMessage();
                
                // Log the actual cause for debugging
                log.error("DataIntegrityViolation: {}", cause);
                
                // Parse common constraint violations for user-friendly messages
                if (cause != null) {
                        String lowerCause = cause.toLowerCase();
                        
                        // Check for unique constraint violations first (more specific)
                        if (lowerCause.contains("duplicate") || lowerCause.contains("unique") || 
                            lowerCause.contains("already exists") || lowerCause.contains("violates unique constraint")) {
                                if (lowerCause.contains("email") || lowerCause.contains("users_email")) {
                                        message = "Email already exists. Please use a different email address.";
                                } else if ((lowerCause.contains("flat") && lowerCause.contains("number")) || 
                                           lowerCause.contains("flat_number")) {
                                        message = "Flat number already exists in this society.";
                                } else if (lowerCause.contains("phone")) {
                                        message = "Phone number already registered.";
                                } else if ((lowerCause.contains("name") && lowerCause.contains("society")) ||
                                           lowerCause.contains("societies_name")) {
                                        message = "Society name already exists.";
                                } else {
                                        message = "This record already exists. Please check for duplicates.";
                                }
                        } 
                        // Check for foreign key violations (less specific, check after unique)
                        else if (lowerCause.contains("foreign key") || lowerCause.contains("fk_") || 
                                 lowerCause.contains("references") || lowerCause.contains("is still referenced") ||
                                 lowerCause.contains("violates foreign key constraint")) {
                                if (lowerCause.contains("is still referenced")) {
                                        // Deletion blocked by FK constraint
                                        message = "Cannot delete this record because it is referenced by other records. Use force delete to auto-clean linked records.";
                                } else if (lowerCause.contains("society_id") || lowerCause.contains("fk_user_society")) {
                                        message = "Invalid society reference. Please select a valid society.";
                                } else if (lowerCause.contains("flat_id") || lowerCause.contains("fk_user_flat")) {
                                        message = "Invalid flat reference. Please select a valid flat.";
                                } else if (lowerCause.contains("user_id")) {
                                        message = "Invalid user reference.";
                                } else if (lowerCause.contains("vendor_id")) {
                                        message = "Cannot delete vendor because it has linked bills or contracts. Use force delete to auto-clean.";
                                } else if (lowerCause.contains("wing_id")) {
                                        message = "Cannot delete wing because it has linked units. Use force delete to auto-clean.";
                                } else if (lowerCause.contains("organization_id")) {
                                        message = "Cannot delete organization because it has linked records. Use force delete to auto-clean.";
                                } else {
                                        message = "Cannot complete this action due to linked records. Use force delete if available.";
                                }
                        }
                        // Handle not-null constraint violations
                        else if (lowerCause.contains("not-null") || lowerCause.contains("null value")) {
                                message = "A required field is missing. Please fill in all required fields.";
                        }
                }
                
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                409,
                                                "Conflict",
                                                message,
                                                request.getRequestURI()));
        }

        @ExceptionHandler(ApiException.class)
        public ResponseEntity<ErrorResponse> handleApi(
                        ApiException ex,
                        HttpServletRequest request) {
                HttpStatus status = ex.getStatus();
                return ResponseEntity.status(status).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                status.value(),
                                                status.getReasonPhrase(),
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDenied(
                        AccessDeniedException ex,
                        HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                403,
                                                "Forbidden",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgument(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                400,
                                                "Bad Request",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<ErrorResponse> handleRuntime(
                        RuntimeException ex,
                        HttpServletRequest request) {
                HttpStatus status = HttpStatus.BAD_REQUEST;
                return ResponseEntity.status(status).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                status.value(),
                                                status.getReasonPhrase(),
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneral(
                        Exception ex,
                        HttpServletRequest request) {
                // Log the actual error for debugging
                log.error("Unexpected error occurred", ex);
                
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                500,
                                                "Internal Server Error",
                                                "An unexpected error occurred. Please try again later.",
                                                request.getRequestURI()));
        }
}
