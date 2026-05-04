package com.bicap.shipping.service;

import com.bicap.shipping.dto.CreateShipmentRequest;
import com.bicap.shipping.dto.PendingConfirmedOrderResponse;
import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Vehicle;
import com.bicap.shipping.constant.VehicleType;
import com.bicap.shipping.repository.DriverRepository;
import com.bicap.shipping.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AutoCreateShipmentScheduler {

    private final PendingConfirmedOrderService pendingConfirmedOrderService;
    private final ShipmentService shipmentService;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    @Value("${bicap.shipping.auto-create.enabled:true}")
    private boolean enabled;

    @Value("${bicap.shipping.auto-create.scheduled-days-ahead:1}")
    private int scheduledDaysAhead;

    public AutoCreateShipmentScheduler(
            PendingConfirmedOrderService pendingConfirmedOrderService,
            ShipmentService shipmentService,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository
    ) {
        this.pendingConfirmedOrderService = pendingConfirmedOrderService;
        this.shipmentService = shipmentService;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Đồng bộ tự động: đơn CONFIRMED chưa có shipment -> tạo shipment CREATED.
     * Idempotent theo orderId vì ShipmentService đã upsert theo orderId.
     */
    @Scheduled(fixedDelayString = "${bicap.shipping.auto-create.fixed-delay-ms:10000}")
    public void autoCreateShipmentsFromConfirmedOrders() {
        if (!enabled) {
            return;
        }
        try {
            List<PendingConfirmedOrderResponse> pending = pendingConfirmedOrderService.listPending(null);
            if (pending.isEmpty()) {
                return;
            }

            List<Driver> activeDrivers = ensureActiveDrivers();
            List<Vehicle> activeVehicles = ensureActiveVehicles();
            LocalDate scheduledDate = LocalDate.now().plusDays(Math.max(0, scheduledDaysAhead));

            for (PendingConfirmedOrderResponse row : pending) {
                if (row.orderId() == null) {
                    continue;
                }

                Long autoDriverId = null;
                Long autoVehicleId = null;
                if (!activeDrivers.isEmpty() && !activeVehicles.isEmpty()) {
                    // Rule round-robin ổn định theo orderId (idempotent, không cần lưu state tạm).
                    int idx = Math.floorMod(row.orderId().intValue(), Math.min(activeDrivers.size(), activeVehicles.size()));
                    autoDriverId = activeDrivers.get(idx).getId();
                    autoVehicleId = activeVehicles.get(idx).getId();
                }

                shipmentService.createShipment(new CreateShipmentRequest(
                        row.orderId(),
                        row.farmId(),
                        row.retailerId(),
                        autoDriverId,
                        autoVehicleId,
                        null,
                        row.deliveryAddress(),
                        scheduledDate
                ));
            }
        } catch (Exception e) {
            System.err.println("[shipping-service] auto-create shipments failed: " + e.getMessage());
        }
    }

    private List<Driver> ensureActiveDrivers() {
        List<Driver> active = driverRepository.findByIsActiveTrueOrderByIdAsc();
        if (!active.isEmpty()) {
            return active;
        }
        Driver seeded = driverRepository.save(Driver.builder()
                .fullName("Auto Driver")
                .phone("0909000000")
                .licenseNo("AUTO-DRIVER-001")
                .licenseClass("B2")
                .isActive(true)
                .build());
        return List.of(seeded);
    }

    private List<Vehicle> ensureActiveVehicles() {
        List<Vehicle> active = vehicleRepository.findByIsActiveTrueOrderByIdAsc();
        if (!active.isEmpty()) {
            return active;
        }
        Vehicle seeded = vehicleRepository.save(Vehicle.builder()
                .licensePlate("AUTO-VEH-001")
                .type(VehicleType.VAN)
                .capacity(500.0)
                .isActive(true)
                .build());
        return List.of(seeded);
    }
}
