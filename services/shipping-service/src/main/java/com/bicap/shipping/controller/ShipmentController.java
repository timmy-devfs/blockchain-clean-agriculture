package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.dto.CreateShipmentRequest;
import com.bicap.shipping.dto.ShipmentResponse;
import com.bicap.shipping.dto.ShipmentStatusHistoryResponse;
import com.bicap.shipping.dto.UpdateShipmentStatusRequest;
import com.bicap.shipping.service.AuthContextService;
import com.bicap.shipping.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
@Tag(name = "Shipment", description = "Shipment lifecycle and driver operations")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuthContextService authContextService;

    public ShipmentController(
            ShipmentService shipmentService,
            AuthContextService authContextService) {
        this.shipmentService = shipmentService;
        this.authContextService = authContextService;
    }

    // Manager API (CRUD shipment) — used by shipping routes in web-app
    @PostMapping("/shipments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo shipment mới")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Payload không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    public ApiResponse<ShipmentResponse> createShipment(@RequestBody CreateShipmentRequest req) {
        // Manager role is recommended, but allow any authenticated for dev
        return ApiResponse.success(shipmentService.createShipment(req));
    }

    @GetMapping("/shipments")
    @Operation(summary = "Lấy danh sách shipment")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    public ApiResponse<List<ShipmentResponse>> listAll() {
        return ApiResponse.success(shipmentService.listAll());
    }

    @GetMapping("/shipments/{id}")
    @Operation(summary = "Lấy chi tiết shipment theo ID")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy chi tiết thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shipment không tồn tại")
    })
    public ApiResponse<ShipmentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(shipmentService.getById(id));
    }

    @GetMapping("/shipments/{id}/history")
    @Operation(summary = "Lấy lịch sử trạng thái shipment")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy lịch sử thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shipment không tồn tại")
    })
    public ApiResponse<List<ShipmentStatusHistoryResponse>> history(@PathVariable Long id) {
        return ApiResponse.success(shipmentService.history(id));
    }

    @DeleteMapping("/shipments/{id}")
    @Operation(summary = "Xóa shipment")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shipment không tồn tại")
    })
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentService.delete(id);
        return ApiResponse.success(null);
    }

    // Driver API — per OpenAPI contract (role SHIPPER)
    @GetMapping("/driver/shipments")
    @Operation(summary = "Driver lấy danh sách shipment của mình")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền SHIPPER")
    })
    public ApiResponse<List<ShipmentResponse>> listDriverShipments() {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        }
        Long driverId = shipmentService.resolveDriverNumericId(userId);
        if (driverId == null) {
            return ApiResponse.success(List.of());
        }
        return ApiResponse.success(shipmentService.listForDriver(driverId));
    }

    @GetMapping("/driver/shipments/{id}")
    @Operation(summary = "Driver lấy chi tiết một shipment của mình")
    public ApiResponse<ShipmentResponse> getDriverShipment(@PathVariable Long id) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        }
        Long driverId = shipmentService.resolveDriverNumericId(userId);
        if (driverId == null || !shipmentService.driverOwnsShipment(id, driverId)) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.success(shipmentService.getById(id));
    }

    @GetMapping("/driver/shipments/{id}/history")
    @Operation(summary = "Driver lấy lịch sử trạng thái shipment của mình")
    public ApiResponse<List<ShipmentStatusHistoryResponse>> getDriverShipmentHistory(@PathVariable Long id) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        }
        Long driverId = shipmentService.resolveDriverNumericId(userId);
        if (driverId == null || !shipmentService.driverOwnsShipment(id, driverId)) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.success(shipmentService.history(id));
    }

    @PostMapping("/driver/shipments/{id}/pickup")
    @Operation(summary = "Driver xác nhận đã lấy hàng")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật pickup thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền SHIPPER"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shipment không tồn tại")
    })
    public ApiResponse<ShipmentResponse> pickup(@PathVariable Long id, @RequestBody(required = false) UpdateShipmentStatusRequest body) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        }
        Long driverId = shipmentService.resolveDriverNumericId(userId);
        if (driverId == null || !shipmentService.driverOwnsShipment(id, driverId)) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        UpdateShipmentStatusRequest req = body != null
                ? body
                : new UpdateShipmentStatusRequest(com.bicap.shipping.constant.ShipmentStatus.PICKED_UP, null, null, null);
        return ApiResponse.success(shipmentService.updateStatus(id, req));
    }

    @PostMapping("/driver/shipments/{id}/status")
    @Operation(summary = "Driver cập nhật trạng thái shipment")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật trạng thái thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền SHIPPER"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shipment không tồn tại")
    })
    public ApiResponse<ShipmentResponse> updateStatus(@PathVariable Long id, @RequestBody UpdateShipmentStatusRequest req) {
        if (!authContextService.hasRole("SHIPPER")) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        String userId = authContextService.currentUserIdOrNull();
        if (userId == null) {
            return ApiResponse.error(ErrorCode.UNAUTHORIZED);
        }
        Long driverId = shipmentService.resolveDriverNumericId(userId);
        if (driverId == null || !shipmentService.driverOwnsShipment(id, driverId)) {
            return ApiResponse.error(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.success(shipmentService.updateStatus(id, req));
    }
}

