package com.bicap.shipping.service;

import com.bicap.shipping.common.ErrorCode;
import com.bicap.shipping.common.OperationResult;
import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.ShipmentStatusHistory;
import com.bicap.shipping.entity.ShippingReport;
import com.bicap.shipping.entity.Vehicle;
import com.bicap.shipping.event.ShipmentEventPublisher;
import com.bicap.shipping.repository.DriverRepository;
import com.bicap.shipping.repository.ShipmentRepository;
import com.bicap.shipping.repository.ShipmentStatusHistoryRepository;
import com.bicap.shipping.repository.ShippingReportRepository;
import com.bicap.shipping.repository.VehicleRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ShippingService {
    private final ShipmentRepository shipmentRepository;
    private final ShipmentStatusHistoryRepository historyRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ShippingReportRepository shippingReportRepository;
    private final ShipmentEventPublisher shipmentEventPublisher;

    public ShippingService(
            ShipmentRepository shipmentRepository,
            ShipmentStatusHistoryRepository historyRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            ShippingReportRepository shippingReportRepository,
            ShipmentEventPublisher shipmentEventPublisher
    ) {
        this.shipmentRepository = shipmentRepository;
        this.historyRepository = historyRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.shippingReportRepository = shippingReportRepository;
        this.shipmentEventPublisher = shipmentEventPublisher;
    }

    public List<Shipment> listShipments() {
        return shipmentRepository.findAll();
    }

    public Optional<Shipment> getShipment(Long id) {
        return shipmentRepository.findById(id);
    }

    public List<ShipmentStatusHistory> getHistory(Long shipmentId) {
        return historyRepository.findByShipmentIdOrderByChangedAtAsc(shipmentId);
    }

    @Transactional
    public Shipment createShipment(Shipment shipment, Authentication auth) {
        if (shipment.getStatus() != null && shipment.getStatus() != ShipmentStatus.CREATED) {
            shipment.setStatus(ShipmentStatus.CREATED);
        }
        if (shipment.getStatus() == null) {
            shipment.setStatus(ShipmentStatus.CREATED);
        }

        Shipment saved = shipmentRepository.save(shipment);

        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(saved.getId())
                .status(saved.getStatus())
                .changedAt(LocalDateTime.now())
                .changedBy(auth != null ? String.valueOf(auth.getPrincipal()) : "system")
                .note("created")
                .build());

        return saved;
    }

    @Transactional
    public OperationResult<Shipment> assign(
            Long shipmentId,
            Long driverId,
            Long vehicleId,
            Authentication auth
    ) {
        Optional<Shipment> opt = shipmentRepository.findById(shipmentId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }
        Shipment s = opt.get();
        if (s.getStatus() != ShipmentStatus.CREATED) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        Optional<Driver> dOpt = driverRepository.findById(driverId);
        if (dOpt.isEmpty()) {
            return OperationResult.fail(ErrorCode.DRIVER_NOT_FOUND);
        }
        if (!Boolean.TRUE.equals(dOpt.get().getIsActive())) {
            return OperationResult.fail(ErrorCode.DRIVER_NOT_ACTIVE);
        }

        Optional<Vehicle> vOpt = vehicleRepository.findById(vehicleId);
        if (vOpt.isEmpty()) {
            return OperationResult.fail(ErrorCode.VEHICLE_NOT_FOUND);
        }
        if (!Boolean.TRUE.equals(vOpt.get().getIsActive())) {
            return OperationResult.fail(ErrorCode.VEHICLE_NOT_ACTIVE);
        }

        s.setDriverId(driverId);
        s.setVehicleId(vehicleId);
        s.setStatus(ShipmentStatus.ASSIGNED);
        Shipment saved = shipmentRepository.save(s);

        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(saved.getId())
                .status(saved.getStatus())
                .changedAt(LocalDateTime.now())
                .changedBy(auth != null ? String.valueOf(auth.getPrincipal()) : "system")
                .note("assigned")
                .build());

        return OperationResult.ok(saved);
    }

    @Transactional
    public OperationResult<Shipment> transition(
            Long shipmentId,
            ShipmentStatus next,
            String note,
            Authentication auth
    ) {
        Optional<Shipment> opt = shipmentRepository.findById(shipmentId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }
        Shipment s = opt.get();

        if (s.getStatus() == ShipmentStatus.CANCELLED) {
            return OperationResult.fail(ErrorCode.SHIPMENT_ALREADY_CANCELLED);
        }
        if (s.getStatus() == ShipmentStatus.DELIVERED) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (next == ShipmentStatus.ASSIGNED || next == ShipmentStatus.CREATED) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if (!canTransition(s.getStatus(), next)) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        s.setStatus(next);
        Shipment saved = shipmentRepository.save(s);

        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(saved.getId())
                .status(saved.getStatus())
                .changedAt(LocalDateTime.now())
                .changedBy(auth != null ? String.valueOf(auth.getPrincipal()) : "system")
                .note(note != null && !note.isBlank() ? note : next.name())
                .build());

        return OperationResult.ok(saved);
    }

    private boolean canTransition(ShipmentStatus from, ShipmentStatus to) {
        if (from == to) {
            return false;
        }
        return switch (from) {
            case CREATED -> to == ShipmentStatus.CANCELLED;
            case ASSIGNED -> to == ShipmentStatus.PICKED_UP || to == ShipmentStatus.CANCELLED;
            case PICKED_UP -> to == ShipmentStatus.IN_TRANSIT;
            case IN_TRANSIT -> to == ShipmentStatus.DELIVERED || to == ShipmentStatus.DELAYED;
            case DELAYED -> to == ShipmentStatus.IN_TRANSIT;
            default -> false;
        };
    }

    public Optional<Long> resolveDriverIdForUser(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return driverRepository.findByUserId(userId).map(Driver::getId);
    }

    public List<Shipment> listShipmentsForDriver(long driverId) {
        return shipmentRepository.findByDriverIdOrderByIdDesc(driverId);
    }

    public Optional<Shipment> getShipmentForDriver(long shipmentId, long driverId) {
        return shipmentRepository.findByIdAndDriverId(shipmentId, driverId);
    }

    @Transactional
    public OperationResult<Shipment> driverPickup(
            long driverId,
            Long shipmentId,
            String qrCode,
            String imageUrl,
            Authentication auth
    ) {
        if (qrCode == null || qrCode.isBlank() || imageUrl == null || imageUrl.isBlank()) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }
        Optional<Long> fromQr = parseShipmentIdFromQr(qrCode);
        long resolvedId;
        if (shipmentId != null) {
            if (fromQr.isEmpty() || !fromQr.get().equals(shipmentId)) {
                return OperationResult.fail(ErrorCode.BAD_REQUEST);
            }
            resolvedId = shipmentId;
        } else if (fromQr.isPresent()) {
            resolvedId = fromQr.get();
        } else {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }

        Optional<Shipment> opt = shipmentRepository.findByIdAndDriverId(resolvedId, driverId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }
        Shipment s = opt.get();
        if (s.getStatus() != ShipmentStatus.ASSIGNED) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        String expectedQr = "SHIP-" + s.getId();
        if (!expectedQr.equals(qrCode.trim())) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }

        s.setStatus(ShipmentStatus.PICKED_UP);
        Shipment saved = shipmentRepository.save(s);
        saveDriverHistory(saved, auth, "pickup", toSingleImageJson(imageUrl));
        shipmentEventPublisher.publishShipmentUpdated(saved);
        return OperationResult.ok(saved);
    }

    @Transactional
    public OperationResult<Shipment> driverDeliver(
            long driverId,
            Long shipmentId,
            String imageUrl,
            String recipientName,
            Authentication auth
    ) {
        if (shipmentId == null || imageUrl == null || imageUrl.isBlank()
                || recipientName == null || recipientName.isBlank()) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }
        Optional<Shipment> opt = shipmentRepository.findByIdAndDriverId(shipmentId, driverId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }
        Shipment s = opt.get();
        if (s.getStatus() != ShipmentStatus.IN_TRANSIT && s.getStatus() != ShipmentStatus.DELAYED) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        s.setStatus(ShipmentStatus.DELIVERED);
        Shipment saved = shipmentRepository.save(s);
        saveDriverHistory(saved, auth, "delivered; recipientName=" + recipientName.trim(), toSingleImageJson(imageUrl));
        shipmentEventPublisher.publishShipmentUpdated(saved);
        return OperationResult.ok(saved);
    }

    @Transactional
    public OperationResult<Shipment> driverPutStatus(
            long driverId,
            Long shipmentId,
            ShipmentStatus status,
            Authentication auth
    ) {
        if (shipmentId == null || status == null) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }
        if (status == ShipmentStatus.CANCELLED) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }
        if (status != ShipmentStatus.IN_TRANSIT && status != ShipmentStatus.DELAYED) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }

        Optional<Shipment> opt = shipmentRepository.findByIdAndDriverId(shipmentId, driverId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }
        Shipment s = opt.get();
        if (!canDriverPutStatus(s.getStatus(), status)) {
            return OperationResult.fail(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        s.setStatus(status);
        Shipment saved = shipmentRepository.save(s);
        saveDriverHistory(saved, auth, status.name(), null);
        shipmentEventPublisher.publishShipmentUpdated(saved);
        return OperationResult.ok(saved);
    }

    @Transactional
    public OperationResult<ShippingReport> driverSubmitReport(
            long driverId,
            Long shipmentId,
            String content,
            String imageUrls,
            Authentication auth
    ) {
        if (shipmentId == null || content == null || content.isBlank()) {
            return OperationResult.fail(ErrorCode.BAD_REQUEST);
        }
        Optional<Shipment> opt = shipmentRepository.findByIdAndDriverId(shipmentId, driverId);
        if (opt.isEmpty()) {
            return OperationResult.fail(ErrorCode.SHIPMENT_NOT_FOUND);
        }

        ShippingReport report = ShippingReport.builder()
                .shipmentId(shipmentId)
                .driverId(driverId)
                .content(content.trim())
                .imageUrls(imageUrls)
                .build();
        ShippingReport saved = shippingReportRepository.save(report);
        return OperationResult.ok(saved);
    }

    private static boolean canDriverPutStatus(ShipmentStatus from, ShipmentStatus to) {
        if (from == to) {
            return false;
        }
        if (to == ShipmentStatus.IN_TRANSIT) {
            return from == ShipmentStatus.PICKED_UP || from == ShipmentStatus.DELAYED;
        }
        if (to == ShipmentStatus.DELAYED) {
            return from == ShipmentStatus.IN_TRANSIT;
        }
        return false;
    }

    private static Optional<Long> parseShipmentIdFromQr(String qrCode) {
        String t = qrCode.trim();
        if (!t.startsWith("SHIP-")) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(t.substring("SHIP-".length())));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private static String toSingleImageJson(String url) {
        return "[\"" + url.replace("\"", "\\\"") + "\"]";
    }

    private void saveDriverHistory(Shipment saved, Authentication auth, String note, String imageUrls) {
        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(saved.getId())
                .status(saved.getStatus())
                .changedAt(LocalDateTime.now())
                .changedBy(auth != null ? String.valueOf(auth.getPrincipal()) : "driver")
                .note(note)
                .imageUrls(imageUrls)
                .build());
    }
}
