package com.bicap.shipping.dto;

public record CreateShippingReportRequest(
        Long shipmentId,
        Long driverId,
        String content,
        String imageUrls
) {}
