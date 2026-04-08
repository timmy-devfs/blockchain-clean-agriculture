package com.bicap.shipping;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

// Đây là điểm khởi động của toàn bộ service
@SpringBootApplication
public class ShippingApplication {
    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(ShippingApplication.class, args);
    }
}
