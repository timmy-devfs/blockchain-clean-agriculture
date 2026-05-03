package com.bicap.shipping.service;

import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.dto.CreateShipmentRequest;
import com.bicap.shipping.dto.ShipmentResponse;
import com.bicap.shipping.dto.ShipmentStatusHistoryResponse;
import com.bicap.shipping.dto.UpdateShipmentStatusRequest;
import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.ShipmentStatusHistory;
import com.bicap.shipping.repository.DriverRepository;
import com.bicap.shipping.repository.ShipmentRepository;
import com.bicap.shipping.repository.ShipmentStatusHistoryRepository;
import com.bicap.shipping.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ShipmentStatusHistoryRepository historyRepository;
    private final ShipmentEventPublisher eventPublisher;
    private final AuthContextService authContextService;

    public ShipmentService(
            ShipmentRepository shipmentRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            ShipmentStatusHistoryRepository historyRepository,
            ShipmentEventPublisher eventPublisher,
            AuthContextService authContextService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.historyRepository = historyRepository;
        this.eventPublisher = eventPublisher;
        this.authContextService = authContextService;
    }

    public static ShipmentResponse toResponse(Shipment s) {
        return new ShipmentResponse(
                s.getId(),
                s.getOrderId(),
                s.getFarmId(),
                s.getRetailerId(),
                s.getDriverId(),
                s.getVehicleId(),
                s.getStatus(),
                s.getPickupAddress(),
                s.getDeliveryAddress(),
                s.getScheduledDate()
        );
    }

    public static ShipmentStatusHistoryResponse toHistoryResponse(ShipmentStatusHistory h) {
        return new ShipmentStatusHistoryResponse(
                h.getId(),
                h.getShipmentId(),
                h.getStatus(),
                h.getChangedAt(),
                h.getChangedBy(),
                h.getNote(),
                h.getImageUrls()
        );
    }

    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest req) {
        if (req.driverId() != null) {
            driverRepository.findById(req.driverId()).orElseThrow();
        }
        if (req.vehicleId() != null) {
            vehicleRepository.findById(req.vehicleId()).orElseThrow();
        }

        Optional<Shipment> existingOpt = shipmentRepository.findFirstByOrderIdOrderByIdDesc(req.orderId());
        if (existingOpt.isPresent()) {
            Shipment s = existingOpt.get();
            s.setDriverId(req.driverId());
            s.setVehicleId(req.vehicleId());
            if (req.farmId() != null) {
                s.setFarmId(req.farmId());
            }
            if (req.retailerId() != null) {
                s.setRetailerId(req.retailerId());
            }
            if (req.pickupAddress() != null) {
                s.setPickupAddress(req.pickupAddress());
            }
            if (req.deliveryAddress() != null) {
                s.setDeliveryAddress(req.deliveryAddress());
            }
            if (req.scheduledDate() != null) {
                s.setScheduledDate(req.scheduledDate());
            }

            ShipmentStatus newStatus = (req.driverId() != null && req.vehicleId() != null)
                    ? ShipmentStatus.ASSIGNED
                    : s.getStatus();
            s.setStatus(newStatus);
            Shipment saved = shipmentRepository.save(s);

            historyRepository.save(ShipmentStatusHistory.builder()
                    .shipmentId(saved.getId())
                    .status(newStatus)
                    .changedAt(LocalDateTime.now())
                    .changedBy(Optional.ofNullable(authContextService.currentUserIdOrNull()).orElse("system"))
                    .note("Driver/vehicle assigned")
                    .imageUrls(null)
                    .build());

            eventPublisher.publishShipmentUpdated(saved, "Driver/vehicle assigned", null, null);
            return toResponse(saved);
        }

        Long farmId = req.farmId() != null ? req.farmId() : 0L;
        Long retailerId = req.retailerId() != null ? req.retailerId() : 0L;

        ShipmentStatus initialStatus = (req.driverId() != null && req.vehicleId() != null)
                ? ShipmentStatus.ASSIGNED
                : ShipmentStatus.CREATED;

        Shipment created = shipmentRepository.save(Shipment.builder()
                .orderId(req.orderId())
                .farmId(farmId)
                .retailerId(retailerId)
                .driverId(req.driverId())
                .vehicleId(req.vehicleId())
                .status(initialStatus)
                .pickupAddress(req.pickupAddress())
                .deliveryAddress(req.deliveryAddress())
                .scheduledDate(req.scheduledDate())
                .build());

        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(created.getId())
                .status(initialStatus)
                .changedAt(LocalDateTime.now())
                .changedBy(Optional.ofNullable(authContextService.currentUserIdOrNull()).orElse("system"))
                .note("Shipment created")
                .imageUrls(null)
                .build());

        eventPublisher.publishShipmentUpdated(created, "Shipment created", null, null);
        return toResponse(created);
    }

    public List<ShipmentResponse> listAll() {
        return shipmentRepository.findAll().stream().map(ShipmentService::toResponse).toList();
    }

    public ShipmentResponse getById(Long id) {
        Shipment s = shipmentRepository.findById(id).orElseThrow();
        return toResponse(s);
    }

    public List<ShipmentStatusHistoryResponse> history(Long shipmentId) {
        return historyRepository.findByShipmentIdOrderByChangedAtDesc(shipmentId).stream()
                .map(ShipmentService::toHistoryResponse)
                .toList();
    }

    public List<ShipmentResponse> listForDriver(Long driverId) {
        return shipmentRepository.findByDriverIdOrderByScheduledDateDesc(driverId).stream()
                .map(ShipmentService::toResponse)
                .toList();
    }

    /**
     * JWT sub từ identity là UUID; legacy / test có thể dùng số Long trực tiếp.
     */
    public Long resolveDriverNumericId(String principalUserId) {
        if (principalUserId == null || principalUserId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(principalUserId);
        } catch (NumberFormatException e) {
            return driverRepository.findByIdentityUserId(principalUserId).map(Driver::getId).orElse(null);
        }
    }

    public boolean driverOwnsShipment(Long shipmentId, Long driverId) {
        if (driverId == null) {
            return false;
        }
        return shipmentRepository.findById(shipmentId)
                .map(s -> Objects.equals(s.getDriverId(), driverId))
                .orElse(false);
    }

    @Transactional
    public ShipmentResponse updateStatus(Long shipmentId, UpdateShipmentStatusRequest req) {
        Shipment s = shipmentRepository.findById(shipmentId).orElseThrow();
        s.setStatus(req.status());
        Shipment saved = shipmentRepository.save(s);

        String actor = Optional.ofNullable(authContextService.currentUserIdOrNull()).orElse("system");
        String imgs = (req.imageUrl() != null && !req.imageUrl().isBlank()) ? "[\"" + req.imageUrl() + "\"]" : null;

        historyRepository.save(ShipmentStatusHistory.builder()
                .shipmentId(saved.getId())
                .status(req.status())
                .changedAt(LocalDateTime.now())
                .changedBy(actor)
                .note(req.note())
                .imageUrls(imgs)
                .build());

        eventPublisher.publishShipmentUpdated(saved, req.note(), req.location(), req.imageUrl());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long shipmentId) {
        // keep history for audit? for now delete shipment only; FK will block if history exists
        shipmentRepository.deleteById(shipmentId);
    }
}

