package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@Tag(name = "Health", description = "Kiểm tra nhanh qua gateway")
public class ShippingHealthController {

    @GetMapping("/health")
    @Operation(summary = "Health check (qua /api/shipping/health)")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of("status", "UP"));
    }
}
