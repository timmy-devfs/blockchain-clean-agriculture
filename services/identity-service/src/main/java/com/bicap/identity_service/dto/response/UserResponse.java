package com.bicap.identity_service.dto.response;

import com.bicap.identity_service.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
//import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    @Schema(description = "Định danh user", example = "8f6b507e-1c54-45b7-96fa-2f3c11a8ac4d")
    private String        id;        // String thay UUID
    @Schema(description = "Email đăng nhập", example = "user@bicap.vn")
    private String        email;
    @Schema(description = "Họ tên hiển thị", example = "Nguyen Van A")
    private String        fullName;
    @Schema(description = "Số điện thoại", example = "0912345678")
    private String        phone;
    @Schema(description = "Role hệ thống", implementation = String.class, example = "ADMIN")
    private User.Role role;
    @Schema(description = "Trạng thái hoạt động", example = "true")
    private Boolean       isActive;
    @Schema(description = "Avatar URL", example = "https://cdn.bicap.vn/avatar/u1.png")
    private String        avatarUrl;
    @Schema(description = "Thời điểm tạo tài khoản", example = "2026-04-20T10:30:00")
    private LocalDateTime createdAt;
}