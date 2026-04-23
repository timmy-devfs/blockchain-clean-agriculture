package com.bicap.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    @Schema(description = "Refresh token opaque string", example = "rt_4f93fd7b...")
    private String refreshToken;
}