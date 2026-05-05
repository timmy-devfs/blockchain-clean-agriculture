package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

public record UpdateShipmentStatusRequest(
        @Schema(description = "Trạng thái mới của shipment", example = "IN_TRANSIT")
        ShipmentStatus status,
        @Schema(description = "Ghi chú vận chuyển", example = "Đã rời kho trung chuyển")
        String note,
        @Schema(description = "Ảnh minh chứng", example = "https://cdn.bicap.vn/shipping/proof-01.jpg")
        String imageUrl,
        @Schema(description = "Vị trí cập nhật", example = "Binh Duong")
        String location
) {
}

