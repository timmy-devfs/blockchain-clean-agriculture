package com.bicap.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TokenUpsertRequest {

    @NotBlank
    private String token;

    @NotBlank
    @Pattern(regexp = "ANDROID|IOS|WEB")
    private String platform;
}

