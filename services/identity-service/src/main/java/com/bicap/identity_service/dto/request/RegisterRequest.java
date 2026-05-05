package com.bicap.identity_service.dto.request;

import com.bicap.identity_service.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255)
    @Schema(description = "Email đăng nhập duy nhất", example = "user@bicap.vn")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be 6–100 characters")
    @Schema(description = "Mật khẩu raw trước khi hash", example = "StrongPass123!")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 255)
    @Schema(description = "Họ tên hiển thị của user", example = "Nguyen Van A")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10–11 digits")
    @Schema(description = "Số điện thoại 10-11 chữ số", example = "0912345678")
    private String phone;

    @NotNull(message = "Role is required")
    @Schema(description = "Vai trò hệ thống", example = "FARM_MANAGER")
    private User.Role role;
}