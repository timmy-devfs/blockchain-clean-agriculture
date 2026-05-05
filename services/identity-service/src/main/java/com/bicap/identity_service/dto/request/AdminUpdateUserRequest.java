package com.bicap.identity_service.dto.request;

import com.bicap.identity_service.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {

    // null = không đổi
    @Schema(description = "Role mới của user (null = giữ nguyên)", example = "RETAILER")
    private User.Role role;

    // null = không đổi
    @Schema(description = "Trạng thái active của user (null = giữ nguyên)", example = "true")
    private Boolean isActive;
}