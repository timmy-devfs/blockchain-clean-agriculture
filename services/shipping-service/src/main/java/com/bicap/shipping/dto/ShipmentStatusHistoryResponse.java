package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ShipmentStatusHistoryResponse(
        @Schema(description = "ID history record", example = "9001")
        Long id,
        @Schema(description = "ID shipment", example = "5001")
        Long shipmentId,
        @Schema(description = "Trạng thái tại thời điểm cập nhật", example = "DELIVERED")
        ShipmentStatus status,
        @Schema(description = "Thời điểm cập nhật", example = "2026-04-23T14:13:17")
        LocalDateTime changedAt,
        @Schema(description = "Người cập nhật trạng thái", example = "driver-12")
        String changedBy,
        @Schema(description = "Ghi chú trạng thái", example = "Giao hàng thành công")
        String note,
        @Schema(description = "Danh sách ảnh (serialized string/JSON)")
        String imageUrls
) {
}

