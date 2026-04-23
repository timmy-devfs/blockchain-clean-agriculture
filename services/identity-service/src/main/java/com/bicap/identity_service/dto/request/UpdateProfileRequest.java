package com.bicap.identity_service.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 255, message = "Full name must be 2-255 characters")
    @Schema(description = "Họ tên mới", example = "Tran Thi B")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    @Schema(description = "Số điện thoại mới", example = "0987654321")
    private String phone;

    @Size(max = 500)
    @Schema(description = "URL ảnh đại diện", example = "https://cdn.bicap.vn/avatar/user-1.png")
    private String avatarUrl;
}