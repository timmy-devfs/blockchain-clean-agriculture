package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.dto.PendingConfirmedOrderResponse;
import com.bicap.shipping.service.PendingConfirmedOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
@Tag(name = "Shipping orders", description = "Đơn chờ vận chuyển")
public class ShippingOrderController {

    private final PendingConfirmedOrderService pendingConfirmedOrderService;

    public ShippingOrderController(PendingConfirmedOrderService pendingConfirmedOrderService) {
        this.pendingConfirmedOrderService = pendingConfirmedOrderService;
    }

    @GetMapping("/orders/confirmed")
    @Operation(summary = "Đơn CONFIRMED chưa có tài xế (hoặc shipment CREATED từ Kafka)")
    public ApiResponse<List<PendingConfirmedOrderResponse>> confirmedOrders(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ApiResponse.success(pendingConfirmedOrderService.listPending(authorization));
    }
}
