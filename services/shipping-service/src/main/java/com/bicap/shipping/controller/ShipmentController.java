package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.dto.CreateShipmentRequest;
import com.bicap.shipping.dto.ShipmentResponse;
import com.bicap.shipping.dto.ShipmentStatusHistoryResponse;
import com.bicap.shipping.dto.UpdateShipmentStatusRequest;
import com.bicap.shipping.service.AuthContextService;
import com.bicap.shipping.service.ShipmentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuthContextService authContextService;

    public ShipmentController(ShipmentService shipmentService, AuthContextService authContextService) {
        this.shipmentService = shipmentService;
        this.authContextService = authContextService;
    }

    // Manager API (CRUD shipment) — used by web-shipping
    @PostMapping("/shipments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShipmentResponse> createShipment(@RequestBody CreateShipmentRequest req) {
        // Manager role is recommended, but allow any authenticated for dev
        return ApiResponse.success(shipmentService.createShipment(req));
    }

    @GetMapping("/shipments")
    public ApiResponse<List<ShipmentResponse>> listAll() {
        return ApiResponse.success(shipmentService.listAll());
    }

    @GetMapping("/shipments/{id}")
    public ApiResponse<ShipmentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(shipmentService.getById(id));
    }

    @GetMapping("/shipments/{id}/history")
    public ApiResponse<List<ShipmentStatusHistoryResponse>> history(@PathVariable Long id) {
        return ApiResponse.success(shipmentService.history(id));
    }

    @DeleteMapping("/shipments/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentService.delete(id);
        return ApiResponse.success(null);
    }

    // Driver API — per OpenAPI contract (role SHIPPER)
    @GetMapping("/driver/shipments")
    public ApiResponse<List<ShipmentResponse>> listDriverShipments() {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        Long driverId = Long.parseLong(userId);
        return ApiResponse.success(shipmentService.listForDriver(driverId));
    }

    @PostMapping("/driver/shipments/{id}/pickup")
    public ApiResponse<ShipmentResponse> pickup(@PathVariable Long id, @RequestBody(required = false) UpdateShipmentStatusRequest body) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        UpdateShipmentStatusRequest req = body != null
                ? body
                : new UpdateShipmentStatusRequest(com.bicap.shipping.constant.ShipmentStatus.PICKED_UP, null, null, null);
        return ApiResponse.success(shipmentService.updateStatus(id, req));
    }

    @PostMapping("/driver/shipments/{id}/status")
    public ApiResponse<ShipmentResponse> updateStatus(@PathVariable Long id, @RequestBody UpdateShipmentStatusRequest req) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.success(shipmentService.updateStatus(id, req));
    }
}

