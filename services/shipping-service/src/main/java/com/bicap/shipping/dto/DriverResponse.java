package com.bicap.shipping.dto;

public record DriverResponse(
        Long id,
        String fullName,
        String phone,
        String licenseNo,
        String licenseClass,
        Boolean isActive
) {
}
