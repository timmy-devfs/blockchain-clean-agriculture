package com.bicap.shipping.service;

import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.repository.DriverRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class ShipmentEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final DriverRepository driverRepository;

    @Value("${bicap.kafka.topics.shipment-updated:bicap.shipment.updated}")
    private String shipmentUpdatedTopic;

    public ShipmentEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            DriverRepository driverRepository) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.driverRepository = driverRepository;
    }

    public void publishShipmentUpdated(Shipment shipment, String note, String location, String imageUrl) {
        publishShipmentUpdated(shipment, note, location, imageUrl, false);
    }

    public void publishShipmentUpdated(
            Shipment shipment,
            String note,
            String location,
            String imageUrl,
            boolean notifyDriverNewOrder) {
        try {
            Map<String, Object> root = new HashMap<>();
            root.put("eventId", UUID.randomUUID().toString());
            root.put("eventType", "SHIPMENT_UPDATED");
            root.put("timestamp", OffsetDateTime.now().toString());
            root.put("version", "1.0");

            Map<String, Object> payload = new HashMap<>();
            payload.put("shipmentId", String.valueOf(shipment.getId()));
            if (shipment.getOrderId() != null) {
                payload.put("orderId", String.valueOf(shipment.getOrderId()));
            }
            if (shipment.getFarmId() != null) payload.put("farmId", String.valueOf(shipment.getFarmId()));
            if (shipment.getRetailerId() != null) payload.put("retailerId", String.valueOf(shipment.getRetailerId()));
            if (shipment.getDriverId() != null) {
                payload.put("driverId", String.valueOf(shipment.getDriverId()));
                driverRepository.findById(shipment.getDriverId())
                        .map(Driver::getIdentityUserId)
                        .filter(uid -> uid != null && !uid.isBlank())
                        .ifPresent(uid -> payload.put("driverUserId", uid));
            }
            payload.put("status", shipment.getStatus().name());
            payload.put("updatedAt", OffsetDateTime.now().toString());
            if (location != null && !location.isBlank()) payload.put("location", location);
            if (note != null && !note.isBlank()) payload.put("note", note);
            if (imageUrl != null && !imageUrl.isBlank()) payload.put("imageUrl", imageUrl);
            if (notifyDriverNewOrder) {
                payload.put("notifyDriverNewOrder", "true");
            }

            root.put("payload", payload);
            String json = objectMapper.writeValueAsString(root);
            kafkaTemplate.send(shipmentUpdatedTopic, String.valueOf(shipment.getId()), json);
        } catch (Exception e) {
            // don't fail the API call if kafka publish fails in dev; log to stderr
            System.err.println("[shipping-service] Failed to publish shipment-updated: " + e.getMessage());
        }
    }
}

