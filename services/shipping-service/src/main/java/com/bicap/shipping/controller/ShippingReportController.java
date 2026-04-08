package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.dto.CreateShippingReportRequest;
import com.bicap.shipping.dto.ShippingReportResponse;
import com.bicap.shipping.service.ShippingReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping/reports")
public class ShippingReportController {
    private final ShippingReportService shippingReportService;

    public ShippingReportController(ShippingReportService shippingReportService) {
        this.shippingReportService = shippingReportService;
    }

    @PostMapping
    public ApiResponse<?> create(@RequestBody CreateShippingReportRequest req) {
        if (req == null || req.shipmentId() == null || req.driverId() == null) {
            return ApiResponse.error(ErrorCode.BAD_REQUEST);
        }
        return ApiResponse.success(shippingReportService.create(req));
    }

    @GetMapping
    public ApiResponse<List<ShippingReportResponse>> list(
            @RequestParam(required = false) Long shipmentId,
            @RequestParam(required = false) Long driverId
    ) {
        return ApiResponse.success(shippingReportService.list(shipmentId, driverId));
    }
}
