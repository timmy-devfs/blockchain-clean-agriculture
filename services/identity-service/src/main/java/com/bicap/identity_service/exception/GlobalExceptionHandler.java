package com.bicap.identity_service.exception;

import com.bicap.identity_service.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── AppException (business errors) ────────────────────────
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("AppException: code={}, message={}", errorCode.getCode(), ex.getMessage());
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getCode(), ex.getMessage()));
    }

    // ── Validation errors (@Valid) ─────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field   = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.<Map<String, String>>builder()
                        .code(ErrorCode.VALIDATION_ERROR.getCode())
                        .message("Validation failed")
                        .data(errors)
                        .build());
    }

    // ── Access Denied ─────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(403)
                .body(ApiResponse.error(
                        ErrorCode.INSUFFICIENT_PERM.getCode(),
                        ErrorCode.INSUFFICIENT_PERM.getMessage()));
    }

    // ── Static resource not found (404) ───────────────────────
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex) {
        return ResponseEntity
                .status(404)
                .body(ApiResponse.error(404, "Resource not found"));
    }

    // ── Generic fallback ──────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity
                .status(500)
                .body(ApiResponse.error(
                        ErrorCode.INTERNAL_ERROR.getCode(),
                        ErrorCode.INTERNAL_ERROR.getMessage()));
    }
}