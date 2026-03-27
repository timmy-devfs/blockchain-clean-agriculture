package com.bicap.identity_service.controller;

import com.bicap.identity_service.common.ApiResponse;
import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;
import com.bicap.identity_service.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Đăng ký, đăng nhập, refresh token, introspect JWT")
public class AuthController {

    private final AuthService authService;

    // ── REGISTER ──────────────────────────────────────────────
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Đăng ký tài khoản mới")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Đăng ký thành công"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email đã tồn tại (ErrorCode 1001)")
    })
    public ApiResponse<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse result = authService.register(request);
        return ApiResponse.<UserResponse>builder()
                .code(201)
                .message("Registered successfully")
                .data(result)
                .build();
    }

    // ── LOGIN ─────────────────────────────────────────────────
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập — trả về accessToken + refreshToken")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng nhập thành công"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Sai credentials (ErrorCode 1002)")
    })
    public ApiResponse<TokenResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ApiResponse.success(authService.login(request));
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────
    @PostMapping("/refresh-token")
    @Operation(summary = "Rotate refresh token — token cũ bị revoke, tạo cặp token mới")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token mới trả về"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Token invalid/revoked/expired")
    })
    public ApiResponse<TokenResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        return ApiResponse.success(authService.refreshToken(request));
    }

    // ── INTROSPECT ────────────────────────────────────────────
    @PostMapping("/introspect")
    @Operation(summary = "Validate JWT — API Gateway gọi endpoint này trước mọi request")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Kết quả validate (valid=true/false)")
    })
    public ApiResponse<IntrospectResponse> introspect(
            @Valid @RequestBody IntrospectRequest request) {

        return ApiResponse.success(authService.introspect(request));
    }
}