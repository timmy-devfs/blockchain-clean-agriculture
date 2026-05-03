package com.bicap.shipping.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tạo tài xế nhanh")
public record CreateDriverRequest(
        @Schema(example = "Nguyễn Văn A")
        String fullName,
        @Schema(example = "0909123456")
        String phone,
        @Schema(description = "Số GPLX", example = "790012345678")
        String licenseNumber,
        @Schema(description = "UUID identity-service (JWT sub) — liên kết app Driver / FCM", example = "a0000001-0001-4001-8001-000000000001")
        String identityUserId
) {
}
