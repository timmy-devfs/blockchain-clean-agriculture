package com.bicap.identity_service.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ── 1xxx: Identity / Auth errors ─────────────────────────
    USER_EXISTS         (1001, "Email already exists",          HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS (1002, "Invalid email or password",     HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED       (1003, "Token has expired",             HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID       (1004, "Token is invalid",              HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED(1005,"Refresh token has been revoked",HttpStatus.UNAUTHORIZED),
    WRONG_PASSWORD      (1006, "Current password is incorrect", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_PERM   (1007, "Insufficient permissions",      HttpStatus.FORBIDDEN),
    USER_NOT_FOUND      (1008, "User not found",                HttpStatus.NOT_FOUND),
    USER_INACTIVE       (1009, "Account has been deactivated",  HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_EXPIRED(1010,"Refresh token has expired",     HttpStatus.UNAUTHORIZED),

    // ── 9xxx: System errors ───────────────────────────────────
    INTERNAL_ERROR      (9001, "Internal server error",         HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR    (9004, "Validation failed",             HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}