package com.bicap.shipping.dto;

import java.time.LocalDate;

public record CreateShipmentRequest(
        Long orderId,
        Long farmId,
        Long retailerId,
        Long driverId,
        Long vehicleId,
        String pickupAddress,
        String deliveryAddress,
        LocalDate scheduledDate
) {
}

