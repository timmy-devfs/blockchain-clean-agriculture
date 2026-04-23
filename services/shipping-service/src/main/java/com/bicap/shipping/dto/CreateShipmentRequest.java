package com.bicap.shipping.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

public record CreateShipmentRequest(
        @Schema(description = "ID đơn hàng", example = "12001")
        Long orderId,
        @Schema(description = "ID farm nguồn", example = "101")
        Long farmId,
        @Schema(description = "ID retailer đích", example = "305")
        Long retailerId,
        @Schema(description = "ID tài xế phụ trách", example = "12")
        Long driverId,
        @Schema(description = "ID phương tiện vận chuyển", example = "7")
        Long vehicleId,
        @Schema(description = "Địa chỉ nhận hàng", example = "Kho Farm, Long An")
        String pickupAddress,
        @Schema(description = "Địa chỉ giao hàng", example = "Siêu thị Retail, TP.HCM")
        String deliveryAddress,
        @Schema(description = "Ngày giao dự kiến", example = "2026-05-01")
        LocalDate scheduledDate
) {
}

