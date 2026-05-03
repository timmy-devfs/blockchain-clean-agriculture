package com.bicap.shipping.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RetailerOrderSnapshot(
        String id,
        String farmId,
        String retailerId,
        String deliveryAddress,
        String status
) {
}
