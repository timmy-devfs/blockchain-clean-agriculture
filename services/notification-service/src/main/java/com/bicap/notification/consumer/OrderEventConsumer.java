package com.bicap.notification.consumer;

import com.bicap.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class OrderEventConsumer extends BaseJsonConsumer {

    private final NotificationDispatcher dispatcher;

    public OrderEventConsumer(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @KafkaListener(topics = "${app.kafka.topics.order-placed}")
    public void consumeOrderPlaced(String rawMessage) {
        JsonNode root = parse(rawMessage);
        if (root == null) return;
        JsonNode payload = root.get("payload");
        String farmId = text(payload, "farmId");
        if (farmId == null) return;

        dispatcher.notifyUser(
                farmId,
                "Ban co don moi",
                "Retailer vua dat mot don hang moi.",
                Map.of("eventType", "ORDER_PLACED", "orderId", text(payload, "orderId"))
        );
    }

    @KafkaListener(topics = "${app.kafka.topics.order-confirmed}")
    public void consumeOrderConfirmed(String rawMessage) {
        JsonNode root = parse(rawMessage);
        if (root == null) return;
        JsonNode payload = root.get("payload");
        String retailerId = text(payload, "retailerId");
        if (retailerId == null) return;

        dispatcher.notifyUser(
                retailerId,
                "Trang trai da xac nhan don",
                "Don hang cua ban da duoc xac nhan.",
                Map.of("eventType", "ORDER_CONFIRMED", "orderId", text(payload, "orderId"))
        );
    }
}

