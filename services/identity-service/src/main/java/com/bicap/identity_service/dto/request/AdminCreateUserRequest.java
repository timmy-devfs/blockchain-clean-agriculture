package com.bicap.identity_service.dto.request;

import com.bicap.identity_service.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AdminCreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Email tài khoản cần tạo", example = "new-admin@bicap.vn")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100)
    @Schema(description = "Mật khẩu tạm thời", example = "AdminPass123!")
    private String password;

    @NotBlank(message = "Full name is required")
    @Schema(description = "Tên hiển thị của tài khoản", example = "BICAP Admin")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    @Schema(description = "Số điện thoại liên hệ", example = "0900000000")
    private String phone;

    // Admin chỉ tạo được account ADMIN qua endpoint này
    @Schema(description = "Role mặc định luôn là ADMIN cho endpoint này", example = "ADMIN")
    private User.Role role = User.Role.ADMIN;
}