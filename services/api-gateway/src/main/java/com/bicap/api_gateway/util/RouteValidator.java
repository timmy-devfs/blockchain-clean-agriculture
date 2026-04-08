package com.bicap.api_gateway.util;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Xác định những path không cần JWT authentication.
 * Gateway sẽ forward thẳng, không gọi introspect.
 */
@Component
public class RouteValidator {

    // Danh sách paths public — không cần Bearer token
    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh-token",
            "/api/auth/introspect",
            "/api/public/",          // guest-service — tất cả public APIs
            "/api/chain/trace/",     // QR trace — người tiêu dùng scan
            "/api/chain/qr/",        // QR image — public
            "/actuator",
            "/fallback"
    );

    public boolean isWhitelisted(String path) {
        return WHITELIST.stream()
                .anyMatch(path::startsWith);
    }
}