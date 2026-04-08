package com.bicap.shipping.dto;

public record ShippingReportResponse(
        Long id,
        Long shipmentId,
        Long driverId,
        String content,
        String imageUrls
) {}
