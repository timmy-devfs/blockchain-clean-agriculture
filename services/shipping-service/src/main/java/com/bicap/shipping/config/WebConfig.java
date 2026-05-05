package com.bicap.shipping.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        // Nginx proxy (unified web-app qua port 80)
                        "http://localhost",
                        "http://127.0.0.1",
                        // Unified web-app (Next.js port 3000)
                        "http://localhost:3000",
                        "http://127.0.0.1:3000",
                        // Legacy shipping standalone (port 3003)
                        "http://localhost:3003",
                        "http://127.0.0.1:3003",
                        // Dev ports khác
                        "http://localhost:3001",
                        "http://localhost:3002",
                        "http://localhost:3004"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}

