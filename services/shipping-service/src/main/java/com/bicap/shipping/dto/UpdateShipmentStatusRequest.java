package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;

public record UpdateShipmentStatusRequest(
        ShipmentStatus status,
        String note,
        String imageUrl,
        String location
) {
}

