package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.dto.CreateDriverRequest;
import com.bicap.shipping.dto.CreateVehicleRequest;
import com.bicap.shipping.dto.DriverResponse;
import com.bicap.shipping.dto.ProvisionDriverRequest;
import com.bicap.shipping.dto.VehicleResponse;
import com.bicap.shipping.service.DriverFleetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
@Tag(name = "Fleet", description = "Tài xế và phương tiện")
public class ShippingFleetController {

    private final DriverFleetService driverFleetService;
    @Value("${bicap.internal.provision-token:bicap-dev-internal}")
    private String internalProvisionToken;

    public ShippingFleetController(DriverFleetService driverFleetService) {
        this.driverFleetService = driverFleetService;
    }

    @GetMapping("/drivers")
    @Operation(summary = "Danh sách tài xế")
    public ApiResponse<List<DriverResponse>> listDrivers() {
        return ApiResponse.success(driverFleetService.listDrivers());
    }

    @PostMapping("/drivers")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Thêm tài xế")
    public ApiResponse<DriverResponse> createDriver(@RequestBody CreateDriverRequest req) {
        return ApiResponse.success(driverFleetService.createDriver(req));
    }

    @PostMapping("/internal/provision-driver")
    @Operation(summary = "Internal: upsert driver theo identity user")
    public ApiResponse<DriverResponse> provisionDriver(
            @RequestHeader("X-Bicap-Internal-Token") String internalToken,
            @RequestBody ProvisionDriverRequest req) {
        if (!internalProvisionToken.equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal provision token");
        }
        return ApiResponse.success(driverFleetService.upsertDriverFromIdentity(req));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Danh sách phương tiện")
    public ApiResponse<List<VehicleResponse>> listVehicles() {
        return ApiResponse.success(driverFleetService.listVehicles());
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Thêm phương tiện")
    public ApiResponse<VehicleResponse> createVehicle(@RequestBody CreateVehicleRequest req) {
        return ApiResponse.success(driverFleetService.createVehicle(req));
    }
}
