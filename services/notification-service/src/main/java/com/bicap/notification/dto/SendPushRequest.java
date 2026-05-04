package com.bicap.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.util.Map;

@Schema(description = "Gửi FCM push tới mọi token đã đăng ký của userId")
public record SendPushRequest(
        @NotBlank
        @Schema(description = "UUID người nhận (JWT sub)", example = "a0000001-0001-4001-8001-000000000001")
        String userId,
        @NotBlank @Schema(example = "Đơn hàng mới") String title,
        @NotBlank @Schema(example = "Bạn có 1 đơn hàng mới.") String body,
        @Schema(description = "FCM data — toàn bộ giá trị string")
        Map<String, String> data
) {}
