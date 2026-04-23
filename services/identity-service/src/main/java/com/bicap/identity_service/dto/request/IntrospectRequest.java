package com.bicap.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class IntrospectRequest {

    @NotBlank(message = "Token is required")
    @Schema(description = "JWT access token cần validate", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String token;
}