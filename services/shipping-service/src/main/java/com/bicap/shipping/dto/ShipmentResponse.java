package com.bicap.shipping.dto;

import com.bicap.shipping.constant.ShipmentStatus;

import java.time.LocalDate;

public record ShipmentResponse(
        Long id,
        Long orderId,
        Long farmId,
        Long retailerId,
        Long driverId,
        Long vehicleId,
        ShipmentStatus status,
        String pickupAddress,
        String deliveryAddress,
        LocalDate scheduledDate
) {
}

