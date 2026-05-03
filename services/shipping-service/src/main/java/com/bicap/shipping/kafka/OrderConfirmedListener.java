package com.bicap.shipping.kafka;

import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Shipment;
import com.bicap.shipping.entity.ShipmentStatusHistory;
import com.bicap.shipping.repository.ShipmentRepository;
import com.bicap.shipping.repository.ShipmentStatusHistoryRepository;
import com.bicap.shipping.service.ShipmentEventPublisher;
import com.bicap.shipping.util.OrderIdUtil;
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
    private final ShipmentEventPublisher shipmentEventPublisher;

    public OrderConfirmedListener(
            ObjectMapper objectMapper,
            ShipmentRepository shipmentRepository,
            ShipmentStatusHistoryRepository historyRepository,
            ShipmentEventPublisher shipmentEventPublisher
    ) {
        this.objectMapper = objectMapper;
        this.shipmentRepository = shipmentRepository;
        this.historyRepository = historyRepository;
        this.shipmentEventPublisher = shipmentEventPublisher;
    }

    @KafkaListener(topics = "${bicap.kafka.topics.order-confirmed:bicap.order.confirmed}", containerFactory = "kafkaListenerContainerFactory")
    public void onOrderConfirmed(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode payload = root.get("payload");
            if (payload == null || payload.isNull()) return;

            Long orderId = payload.hasNonNull("orderId") ? OrderIdUtil.toNumericId(payload.get("orderId").asText()) : null;
            Long farmId = payload.hasNonNull("farmId") ? OrderIdUtil.toNumericId(payload.get("farmId").asText()) : null;
            Long retailerId = payload.hasNonNull("retailerId") ? OrderIdUtil.toNumericId(payload.get("retailerId").asText()) : null;
            String deliveryAddress = payload.hasNonNull("deliveryAddress") ? payload.get("deliveryAddress").asText() : null;

            if (orderId == null) return;

            long farm = farmId != null ? farmId : 0L;
            long retail = retailerId != null ? retailerId : 0L;

            Shipment created = shipmentRepository.save(Shipment.builder()
                    .orderId(orderId)
                    .farmId(farm)
                    .retailerId(retail)
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

            shipmentEventPublisher.publishShipmentUpdated(
                    created,
                    "Lo hang moi duoc tao tu ORDER_CONFIRMED",
                    null,
                    null
            );
        } catch (Exception e) {
            System.err.println("[shipping-service] Failed to handle order-confirmed: " + e.getMessage());
        }
    }

}

