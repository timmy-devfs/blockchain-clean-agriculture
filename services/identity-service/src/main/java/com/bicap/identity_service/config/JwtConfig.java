package com.bicap.identity_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {

    private String secret;
    private long accessTokenExpiry;    // ms — 15 phút
    private long refreshTokenExpiry;   // ms — 7 ngày
}