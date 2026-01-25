package com.society.backend.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.society.backend.dto.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {
                String message = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .findFirst()
                                .map(FieldError::getDefaultMessage)
                                .orElse("Validation failed");

                return ResponseEntity.badRequest().body(
                                new ErrorResponse(
                                                LocalDateTime.now(),
                                                400,
                                                "Validation Error",
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
}
