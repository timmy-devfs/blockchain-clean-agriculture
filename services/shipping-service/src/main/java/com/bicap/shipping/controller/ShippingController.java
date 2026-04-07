package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.common.OperationResult;
import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.Vehicle;
import com.bicap.shipping.repository.DriverRepository;
import com.bicap.shipping.repository.VehicleRepository;
import com.bicap.shipping.service.ShippingService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {
    private final ShippingService shippingService;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public ShippingController(
            ShippingService shippingService,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository
    ) {
        this.shippingService = shippingService;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping("/shipments")
    public ApiResponse<List<Shipment>> listShipments() {
        return ApiResponse.success(shippingService.listShipments());
    }

    @GetMapping("/shipments/{id}")
    public ApiResponse<?> getShipment(@PathVariable Long id) {
        return shippingService.getShipment(id)
                .<ApiResponse<?>>map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error(ErrorCode.SHIPMENT_NOT_FOUND));
    }

    @GetMapping("/shipments/{id}/history")
    public ApiResponse<?> history(@PathVariable Long id) {
        return ApiResponse.success(shippingService.getHistory(id));
    }

    @PostMapping("/shipments")
    public ApiResponse<?> createShipment(@RequestBody Shipment shipment, Authentication auth) {
        return ApiResponse.success(shippingService.createShipment(shipment, auth));
    }

    public record AssignRequest(Long driverId, Long vehicleId) {}

    @PostMapping("/shipments/{id}/assign")
    public ApiResponse<?> assign(@PathVariable Long id, @RequestBody AssignRequest req, Authentication auth) {
        if (req == null || req.driverId() == null || req.vehicleId() == null) {
            return ApiResponse.error(ErrorCode.BAD_REQUEST);
        }
        OperationResult<Shipment> r = shippingService.assign(id, req.driverId(), req.vehicleId(), auth);
        return r.isSuccess()
                ? ApiResponse.success(r.getData())
                : ApiResponse.error(r.getErrorCode());
    }

    public record StatusUpdateRequest(ShipmentStatus status, String note) {}

    @PatchMapping("/shipments/{id}/status")
    public ApiResponse<?> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest req,
            Authentication auth
    ) {
        if (req == null || req.status() == null) {
            return ApiResponse.error(ErrorCode.BAD_REQUEST);
        }
        OperationResult<Shipment> r = shippingService.transition(id, req.status(), req.note(), auth);
        return r.isSuccess()
                ? ApiResponse.success(r.getData())
                : ApiResponse.error(r.getErrorCode());
    }

    @GetMapping("/drivers")
    public ApiResponse<List<Driver>> listDrivers() {
        return ApiResponse.success(driverRepository.findAll());
    }

    @PostMapping("/drivers")
    public ApiResponse<Driver> createDriver(@RequestBody Driver driver) {
        return ApiResponse.success(driverRepository.save(driver));
    }

    @GetMapping("/vehicles")
    public ApiResponse<List<Vehicle>> listVehicles() {
        return ApiResponse.success(vehicleRepository.findAll());
    }

    @PostMapping("/vehicles")
    public ApiResponse<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        return ApiResponse.success(vehicleRepository.save(vehicle));
    }
}
