package com.bicap.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TokenUpsertRequest {

    @NotBlank
    @Schema(description = "FCM registration token của thiết bị", example = "fcm_token_xxx")
    private String token;

    @NotBlank
    @Pattern(regexp = "ANDROID|IOS|WEB")
    @Schema(description = "Nền tảng thiết bị", example = "ANDROID", allowableValues = {"ANDROID", "IOS", "WEB"})
    private String platform;
}

