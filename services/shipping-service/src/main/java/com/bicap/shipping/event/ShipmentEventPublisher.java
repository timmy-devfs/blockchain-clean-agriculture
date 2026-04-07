package com.bicap.shipping.event;

import com.bicap.shipping.entity.Shipment;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ShipmentEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${shipping.kafka.topic.shipment-updated}")
    private String shipmentUpdatedTopic;

    public ShipmentEventPublisher(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishShipmentUpdated(Shipment shipment) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", "ShipmentUpdatedEvent");
        payload.put("shipmentId", shipment.getId());
        payload.put("status", shipment.getStatus() != null ? shipment.getStatus().name() : null);
        payload.put("driverId", shipment.getDriverId());
        payload.put("timestamp", Instant.now().toString());

        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize ShipmentUpdatedEvent", e);
        }

        kafkaTemplate.send(shipmentUpdatedTopic, String.valueOf(shipment.getId()), json);
    }
}
