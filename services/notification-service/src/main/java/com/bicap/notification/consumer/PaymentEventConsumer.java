package com.bicap.notification.consumer;

import com.bicap.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class PaymentEventConsumer extends BaseJsonConsumer {

    private final NotificationDispatcher dispatcher;

    public PaymentEventConsumer(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-success}")
    public void consumePaymentSuccess(String rawMessage) {
        JsonNode root = parse(rawMessage);
        if (root == null) return;
        JsonNode payload = root.get("payload");

        String type = text(payload, "type");
        if (!"DEPOSIT".equals(type) && !"PACKAGE_FEE".equals(type)) {
            return;
        }

        String farmId = text(payload, "farmId");
        if (farmId == null) {
            farmId = text(payload, "payerId");
        }
        if (farmId == null) return;

        String amount = text(payload, "amount");
        String orderId = text(payload, "orderId");
        String body = "Thanh toan " + type + " thanh cong" + (amount == null ? "." : ": " + amount);

        Map<String, String> data = new HashMap<>();
        data.put("eventType", "PAYMENT_SUCCESS");
        data.put("type", type);
        data.put("paymentId", valueOrEmpty(text(payload, "paymentId")));
        data.put("orderId", valueOrEmpty(orderId));
        data.put("paidAt", valueOrEmpty(text(payload, "paidAt")));
        data.put("amount", valueOrEmpty(amount));

        dispatcher.notifyUser(
                farmId,
                "Thanh toan thanh cong",
                body,
                data
        );
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}
