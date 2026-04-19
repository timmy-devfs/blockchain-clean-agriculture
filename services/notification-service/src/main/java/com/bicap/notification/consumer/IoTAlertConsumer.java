package com.bicap.notification.consumer;

import com.bicap.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class IoTAlertConsumer extends BaseJsonConsumer {

    private final NotificationDispatcher dispatcher;

    public IoTAlertConsumer(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @KafkaListener(topics = "${app.kafka.topics.iot-alert}")
    public void consumeIotAlert(String rawMessage) {
        JsonNode root = parse(rawMessage);
        if (root == null) return;
        JsonNode payload = root.get("payload");
        String farmId = text(payload, "farmId");
        if (farmId == null) return;
        String sensorType = text(payload, "sensorType");
        String value = text(payload, "value");

        dispatcher.notifyUser(
                farmId,
                "Canh bao IoT",
                "Canh bao: " + (sensorType == null ? "SENSOR" : sensorType) + "=" + (value == null ? "N/A" : value),
                Map.of("eventType", "IOT_ALERT", "alertId", text(payload, "alertId"))
        );
    }
}

