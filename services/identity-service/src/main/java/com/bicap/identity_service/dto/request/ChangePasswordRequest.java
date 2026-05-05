package com.bicap.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    @Schema(description = "Mật khẩu hiện tại", example = "OldPass123!")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "New password must be 6-100 characters")
    @Schema(description = "Mật khẩu mới", example = "NewPass456!")
    private String newPassword;
}