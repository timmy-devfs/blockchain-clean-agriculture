package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

public record ShipmentResponse(
        @Schema(description = "ID shipment", example = "5001")
        Long id,
        @Schema(description = "ID order", example = "12001")
        Long orderId,
        @Schema(description = "ID farm", example = "101")
        Long farmId,
        @Schema(description = "ID retailer", example = "305")
        Long retailerId,
        @Schema(description = "ID driver", example = "12")
        Long driverId,
        @Schema(description = "ID vehicle", example = "7")
        Long vehicleId,
        @Schema(description = "Trạng thái hiện tại", example = "ASSIGNED")
        ShipmentStatus status,
        @Schema(description = "Địa chỉ lấy hàng", example = "Kho Farm, Long An")
        String pickupAddress,
        @Schema(description = "Địa chỉ giao hàng", example = "Siêu thị Retail, TP.HCM")
        String deliveryAddress,
        @Schema(description = "Ngày giao dự kiến", example = "2026-05-01")
        LocalDate scheduledDate,
        @Schema(description = "Tên nông trại (hiển thị)", nullable = true)
        String farmName,
        @Schema(description = "Tên nhà bán lẻ (hiển thị)", nullable = true)
        String retailerName
) {
}

