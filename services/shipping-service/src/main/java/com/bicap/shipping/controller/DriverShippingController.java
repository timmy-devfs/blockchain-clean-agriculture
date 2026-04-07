package com.bicap.shipping.controller;

import com.bicap.shipping.common.ApiResponse;
import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.common.OperationResult;
import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.ShippingReport;
import com.bicap.shipping.service.ShippingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipping/driver")
public class DriverShippingController {

    private final ShippingService shippingService;

    public DriverShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    public record PickupRequest(Long shipmentId, String qrCode, String imageUrl) {}

    public record DeliverRequest(Long shipmentId, String imageUrl, String recipientName) {}

    public record DriverStatusRequest(Long shipmentId, ShipmentStatus status) {}

    public record DriverReportRequest(Long shipmentId, String content, String imageUrls) {}

    @GetMapping("/shipments")
    public ResponseEntity<ApiResponse<?>> listShipments(Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        List<Shipment> list = shippingService.listShipmentsForDriver(driverId.get());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/shipments/{id}")
    public ResponseEntity<ApiResponse<?>> getShipment(@PathVariable Long id, Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        return shippingService.getShipmentForDriver(id, driverId.get())
                .<ResponseEntity<ApiResponse<?>>>map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> notFound(ErrorCode.SHIPMENT_NOT_FOUND));
    }

    @PostMapping("/pickup")
    public ResponseEntity<ApiResponse<?>> pickup(@RequestBody PickupRequest req, Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        if (req == null) {
            return badRequest(ErrorCode.BAD_REQUEST);
        }
        OperationResult<Shipment> r = shippingService.driverPickup(
                driverId.get(), req.shipmentId(), req.qrCode(), req.imageUrl(), auth);
        return toResponse(r);
    }

    @PostMapping("/deliver")
    public ResponseEntity<ApiResponse<?>> deliver(@RequestBody DeliverRequest req, Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        if (req == null) {
            return badRequest(ErrorCode.BAD_REQUEST);
        }
        OperationResult<Shipment> r = shippingService.driverDeliver(
                driverId.get(), req.shipmentId(), req.imageUrl(), req.recipientName(), auth);
        return toResponse(r);
    }

    @PutMapping("/status")
    public ResponseEntity<ApiResponse<?>> updateStatus(@RequestBody DriverStatusRequest req, Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        if (req == null) {
            return badRequest(ErrorCode.BAD_REQUEST);
        }
        OperationResult<Shipment> r = shippingService.driverPutStatus(
                driverId.get(), req.shipmentId(), req.status(), auth);
        return toResponse(r);
    }

    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<?>> submitReport(@RequestBody DriverReportRequest req, Authentication auth) {
        Optional<ResponseEntity<ApiResponse<?>>> denied = rejectUnlessDriver(auth);
        if (denied.isPresent()) {
            return denied.get();
        }
        Long userId = requireUserId(auth);
        if (userId == null) {
            return unauthorized();
        }
        Optional<Long> driverId = shippingService.resolveDriverIdForUser(userId);
        if (driverId.isEmpty()) {
            return notFound(ErrorCode.DRIVER_NOT_FOUND);
        }
        if (req == null) {
            return badRequest(ErrorCode.BAD_REQUEST);
        }
        OperationResult<ShippingReport> r = shippingService.driverSubmitReport(
                driverId.get(), req.shipmentId(), req.content(), req.imageUrls(), auth);
        return toResponse(r);
    }

    private static Optional<ResponseEntity<ApiResponse<?>>> rejectUnlessDriver(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.of(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ErrorCode.UNAUTHORIZED)));
        }
        if (hasAuthority(auth, "ROLE_SHIPPING_MANAGER")) {
            return Optional.of(ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ErrorCode.FORBIDDEN)));
        }
        if (!hasAuthority(auth, "ROLE_SHIP_DRIVER") && !hasAuthority(auth, "ROLE_SHIPPER")) {
            return Optional.of(ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ErrorCode.FORBIDDEN)));
        }
        return Optional.empty();
    }

    private static boolean hasAuthority(Authentication auth, String authority) {
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(authority::equals);
    }

    private static Long requireUserId(Authentication auth) {
        if (auth.getPrincipal() == null) {
            return null;
        }
        try {
            return Long.parseLong(auth.getPrincipal().toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static ResponseEntity<ApiResponse<?>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ErrorCode.UNAUTHORIZED));
    }

    private static ResponseEntity<ApiResponse<?>> notFound(ErrorCode code) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(code));
    }

    private static ResponseEntity<ApiResponse<?>> badRequest(ErrorCode code) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(code));
    }

    private static <T> ResponseEntity<ApiResponse<?>> toResponse(OperationResult<T> r) {
        if (r.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.success(r.getData()));
        }
        ErrorCode ec = r.getErrorCode();
        HttpStatus status = switch (ec) {
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case SHIPMENT_NOT_FOUND, DRIVER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status).body(ApiResponse.error(ec));
    }
}
