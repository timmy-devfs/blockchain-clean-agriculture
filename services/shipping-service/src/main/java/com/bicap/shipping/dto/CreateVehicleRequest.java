package com.bicap.shipping.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tạo phương tiện")
public record CreateVehicleRequest(
        @Schema(example = "51H-12345")
        String licensePlate,
        @Schema(description = "MOTORBIKE | VAN | TRUCK", example = "VAN")
        String type,
        @Schema(example = "500")
        Double capacity
) {
}
