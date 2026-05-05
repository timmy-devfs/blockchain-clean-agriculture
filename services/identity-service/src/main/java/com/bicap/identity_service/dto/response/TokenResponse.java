package com.bicap.identity_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    @Schema(description = "JWT access token để gọi API", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;
    @Schema(description = "Refresh token để rotate", example = "rt_d20f6455...")
    private String refreshToken;
    @Schema(description = "Thời gian sống của access token (giây)", example = "900")
    private long   expiresIn;      // giây
    @Schema(description = "Vai trò của user", example = "ADMIN")
    private String role;
    @Schema(description = "Thông tin user đăng nhập")
    private UserResponse user;
}