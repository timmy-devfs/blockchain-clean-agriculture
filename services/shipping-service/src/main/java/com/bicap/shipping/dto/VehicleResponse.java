package com.bicap.shipping.dto;

import com.bicap.shipping.constant.VehicleType;

public record VehicleResponse(
        Long id,
        String licensePlate,
        VehicleType type,
        Double capacity,
        Boolean isActive
) {
}
