package com.bicap.shipping.kafka;

import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.ShipmentStatusHistory;
import com.bicap.shipping.repository.ShipmentRepository;
import com.bicap.shipping.repository.ShipmentStatusHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class OrderConfirmedListener {

    private final ObjectMapper objectMapper;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentStatusHistoryRepository historyRepository;

    public OrderConfirmedListener(ObjectMapper objectMapper, ShipmentRepository shipmentRepository, ShipmentStatusHistoryRepository historyRepository) {
        this.objectMapper = objectMapper;
        this.shipmentRepository = shipmentRepository;
        this.historyRepository = historyRepository;
    }

    @KafkaListener(topics = "${bicap.kafka.topics.order-confirmed:bicap.order.confirmed}", containerFactory = "kafkaListenerContainerFactory")
    public void onOrderConfirmed(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode payload = root.get("payload");
            if (payload == null || payload.isNull()) return;

            Long orderId = payload.hasNonNull("orderId") ? toNumericId(payload.get("orderId").asText()) : null;
            Long farmId = payload.hasNonNull("farmId") ? toNumericId(payload.get("farmId").asText()) : null;
            Long retailerId = payload.hasNonNull("retailerId") ? toNumericId(payload.get("retailerId").asText()) : null;
            String deliveryAddress = payload.hasNonNull("deliveryAddress") ? payload.get("deliveryAddress").asText() : null;

            if (orderId == null) return;

            Shipment created = shipmentRepository.save(Shipment.builder()
                    .orderId(orderId)
                    .farmId(farmId)
                    .retailerId(retailerId)
                    .driverId(null)
                    .vehicleId(null)
                    .status(ShipmentStatus.CREATED)
                    .pickupAddress(null)
                    .deliveryAddress(deliveryAddress)
                    .scheduledDate(LocalDate.now().plusDays(1))
                    .build());

            historyRepository.save(ShipmentStatusHistory.builder()
                    .shipmentId(created.getId())
                    .status(ShipmentStatus.CREATED)
                    .changedAt(LocalDateTime.now())
                    .changedBy("kafka")
                    .note("Auto-created from ORDER_CONFIRMED")
                    .imageUrls(null)
                    .build());
        } catch (Exception e) {
            System.err.println("[shipping-service] Failed to handle order-confirmed: " + e.getMessage());
        }
    }

    /**
     * Backward-compatible ID conversion:
     * - Numeric IDs: keep original value
     * - UUID/string IDs from new services: map to deterministic positive long
     */
    private static Long toNumericId(String raw) {
        try {
            return Long.parseLong(raw);
        } catch (Exception e) {
            if (raw == null || raw.isBlank()) {
                return null;
            }
            return (long) Integer.toUnsignedLong(raw.hashCode());
        }
    }
}

