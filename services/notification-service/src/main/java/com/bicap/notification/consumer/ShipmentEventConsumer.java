package com.bicap.notification.consumer;

import com.bicap.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ShipmentEventConsumer extends BaseJsonConsumer {

    private final NotificationDispatcher dispatcher;

    public ShipmentEventConsumer(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @KafkaListener(topics = "${app.kafka.topics.shipment-updated}")
    public void consumeShipmentUpdated(String rawMessage) {
        JsonNode root = parse(rawMessage);
        if (root == null) return;
        JsonNode payload = root.get("payload");
        String status = text(payload, "status");
        String orderId = text(payload, "orderId");
        String body = status == null ? "Trang thai van chuyen da duoc cap nhat." : "Trang thai van chuyen: " + status;

        String farmId = text(payload, "farmId");
        if (farmId != null) {
            dispatcher.notifyUser(
                    farmId,
                    "Cap nhat van chuyen",
                    body,
                    Map.of("eventType", "SHIPMENT_UPDATED", "orderId", orderId == null ? "" : orderId)
            );
        }

        String retailerId = text(payload, "retailerId");
        if (retailerId != null) {
            dispatcher.notifyUser(
                    retailerId,
                    "Cap nhat van chuyen",
                    body,
                    Map.of("eventType", "SHIPMENT_UPDATED", "orderId", orderId == null ? "" : orderId)
            );
        }

        String driverUserId = text(payload, "driverUserId");
        if (driverUserId != null && !driverUserId.isBlank()) {
            dispatcher.notifyUser(
                    driverUserId,
                    "Cap nhat van chuyen (tai xe)",
                    body,
                    Map.of("eventType", "SHIPMENT_UPDATED", "orderId", orderId == null ? "" : orderId)
            );
        } else {
            String driverId = text(payload, "driverId");
            if (driverId != null && !driverId.isBlank()) {
                dispatcher.notifyUser(
                        driverId,
                        "Cap nhat van chuyen (tai xe)",
                        body,
                        Map.of("eventType", "SHIPMENT_UPDATED", "orderId", orderId == null ? "" : orderId)
                );
            }
        }
    }
}

