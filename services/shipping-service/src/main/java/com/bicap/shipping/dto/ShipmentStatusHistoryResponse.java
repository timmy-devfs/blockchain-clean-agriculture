package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;

import java.time.LocalDateTime;

public record ShipmentStatusHistoryResponse(
        Long id,
        Long shipmentId,
        ShipmentStatus status,
        LocalDateTime changedAt,
        String changedBy,
        String note,
        String imageUrls
) {
}

