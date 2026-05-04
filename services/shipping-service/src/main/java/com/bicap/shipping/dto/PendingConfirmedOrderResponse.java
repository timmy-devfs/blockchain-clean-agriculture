package com.bicap.shipping.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Đơn CONFIRMED chờ tạo/ghép shipment (chưa có tài xế)")
public record PendingConfirmedOrderResponse(
        @Schema(description = "ID đơn gốc (Mongo)", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        String id,
        @Schema(description = "orderId dạng số dùng cho shipping DB / POST shipment", example = "6917529027641081976")
        Long orderId,
        @Schema(description = "Địa chỉ giao")
        String deliveryAddress,
        @Schema(description = "Shipment đã có (Kafka) nhưng chưa assign", nullable = true)
        Long shipmentId,
        @Schema(description = "farmId số (hash)", nullable = true)
        Long farmId,
        @Schema(description = "retailerId số (hash)", nullable = true)
        Long retailerId,
        @Schema(description = "Mongo farm ObjectId (hex) — tra tên nông trại", nullable = true)
        String farmExternalId,
        @Schema(description = "Mongo retailer ObjectId (hex) — tra tên nhà bán lẻ", nullable = true)
        String retailerExternalId
) {
}
