package com.bicap.notification.consumer;

import com.bicap.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
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
                    baseShipmentData(payload, orderId, status, false)
            );
        }

        String retailerId = text(payload, "retailerId");
        if (retailerId != null) {
            dispatcher.notifyUser(
                    retailerId,
                    "Cap nhat van chuyen",
                    body,
                    baseShipmentData(payload, orderId, status, false)
            );
        }

        String driverUserId = text(payload, "driverUserId");
        if (driverUserId != null && !driverUserId.isBlank()) {
            dispatcher.notifyUser(
                    driverUserId,
                    "Đơn hàng mới",
                    "Bạn có 1 đơn hàng mới.",
                    baseShipmentData(payload, orderId, status, true)
            );
        } else {
            String driverId = text(payload, "driverId");
            if (driverId != null && !driverId.isBlank()) {
                dispatcher.notifyUser(
                        driverId,
                        "Đơn hàng mới",
                        "Bạn có 1 đơn hàng mới.",
                        baseShipmentData(payload, orderId, status, true)
                );
            }
        }
    }

    private Map<String, String> baseShipmentData(
            JsonNode payload,
            String orderId,
            String status,
            boolean forDriver) {
        Map<String, String> m = new HashMap<>();
        m.put("eventType", "SHIPMENT_UPDATED");
        m.put("orderId", orderId == null ? "" : orderId);
        String shipmentId = text(payload, "shipmentId");
        if (shipmentId != null) {
            m.put("shipmentId", shipmentId);
        }
        if (status != null) {
            m.put("status", status);
        }
        if (forDriver) {
            m.put("screen", "shipment_detail");
            if ("ASSIGNED".equalsIgnoreCase(status)) {
                m.put("type", "NEW_SHIPMENT");
            } else {
                m.put("type", "SHIPMENT_UPDATE");
            }
        }
        return m;
    }
}

