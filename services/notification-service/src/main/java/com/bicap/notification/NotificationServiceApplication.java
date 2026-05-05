package com.bicap.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
// Chỉ định chính xác nơi chứa JPA Repository (MySQL)
@EnableJpaRepositories(basePackages = "com.bicap.notification.repository")
@EnableMethodSecurity
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}