package com.bicap.identity_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Email đăng nhập", example = "admin@bicap.vn")
    private String email;

    @NotBlank(message = "Password is required")
    @Schema(description = "Mật khẩu đăng nhập", example = "StrongPass123!")
    private String password;
}